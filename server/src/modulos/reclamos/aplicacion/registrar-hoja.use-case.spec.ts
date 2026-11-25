import { AvisosDePrueba } from '../../../../test/avisos/dobles/avisos-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { CorreosDePrueba } from '../../../../test/correo/dobles/correos-de-prueba';
import { EnMemoriaHojaRepository } from '../../../../test/reclamos/dobles/en-memoria-hoja.repository';
import { GeneradorDeCodigoDePrueba } from '../../../../test/reclamos/dobles/generador-de-codigo-de-prueba';
import {
  unaHojaValida,
  unRepresentante,
} from '../../../../test/reclamos/fabricas/datos-de-hoja';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { SinDatosDelProveedorAdapter } from '../infraestructura/proveedor/sin-datos-del-proveedor.adapter';
import { RegistrarHojaUseCase } from './registrar-hoja.use-case';

const JUGADOR = 12;

describe('RegistrarHojaUseCase', () => {
  let hojas: EnMemoriaHojaRepository;
  let correos: CorreosDePrueba;
  let reloj: RelojDePrueba;
  let avisos: AvisosDePrueba;
  let registrar: RegistrarHojaUseCase;

  beforeEach(() => {
    hojas = new EnMemoriaHojaRepository();
    correos = new CorreosDePrueba();
    reloj = new RelojDePrueba(new Date('2026-11-25T15:00:00.000Z'));
    avisos = new AvisosDePrueba();
    registrar = new RegistrarHojaUseCase({
      hojas,
      generador: new GeneradorDeCodigoDePrueba(),
      proveedor: new SinDatosDelProveedorAdapter(),
      correos,
      avisos,
      reloj,
    });
  });

  it('da la constancia con el número correlativo del año, el código y la fecha límite', async () => {
    const constancia = await registrar.ejecutar(unaHojaValida(), null);

    expect(constancia).toMatchObject({
      numero: '000001-2026',
      codigo: 'K7QP-4ZMD',
      registradaEn: reloj.ahora(),
      fechaLimite: '2026-12-16',
      proveedor: { razonSocial: null, ruc: null, direccion: null },
    });
    expect(constancia.hoja).toMatchObject({
      tipo: 'RECLAMO',
      consumidor: { nombres: 'Valeria', correo: 'valeria.leon@gmail.com' },
      servicio: { servicio: 'RESERVA_DE_CANCHA', montoReclamado: '40.00' },
      medioDeRespuesta: 'CORREO',
    });
  });

  it('numera las hojas una tras otra', async () => {
    await registrar.ejecutar(unaHojaValida(), null);

    const segunda = await registrar.ejecutar(unaHojaValida(), null);

    expect(segunda.numero).toBe('000002-2026');
  });

  it('guarda la hoja con su código y, si reclamó con su cuenta, con el jugador', async () => {
    await registrar.ejecutar(unaHojaValida(), JUGADOR);

    expect(hojas.guardadas[0]).toMatchObject({
      codigo: 'K7QP4ZMD',
      titularId: JUGADOR,
    });
  });

  it('envía la copia de la hoja al correo de quien reclama', async () => {
    await registrar.ejecutar(unaHojaValida(), null);

    expect(correos.enviados).toHaveLength(1);
    expect(correos.enviados[0]).toMatchObject({
      para: 'valeria.leon@gmail.com',
      asunto: 'Hoja de reclamación N.º 000001-2026',
    });
    expect(correos.enviados[0].texto).toContain('K7QP-4ZMD');
  });

  it('si es menor de edad, también envía la copia a quien lo representa', async () => {
    await registrar.ejecutar(
      unaHojaValida({ esMenorDeEdad: true, ...unRepresentante() }),
      null,
    );

    expect(correos.enviados.map((c) => c.para)).toEqual([
      'valeria.leon@gmail.com',
      'rosa.paredes@gmail.com',
    ]);
  });

  it('con datos inválidos no guarda nada ni envía correos', async () => {
    await expect(
      registrar.ejecutar(unaHojaValida({ detalle: '' }), null),
    ).rejects.toThrow(ReglaInvalidaError);

    expect(hojas.guardadas).toHaveLength(0);
    expect(correos.enviados).toHaveLength(0);
  });

  it('avisa a administración que llegó una hoja nueva', async () => {
    await registrar.ejecutar(unaHojaValida(), null);

    expect(avisos.enviados).toEqual([
      {
        para: 'ADMINISTRADOR',
        tipo: 'NUEVO_RECLAMO',
        referencia: '000001-2026',
      },
    ]);
  });
});
