import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { CorreosDePrueba } from '../../../../test/correo/dobles/correos-de-prueba';
import { EnMemoriaHojaRepository } from '../../../../test/reclamos/dobles/en-memoria-hoja.repository';
import { GeneradorDeCodigoDePrueba } from '../../../../test/reclamos/dobles/generador-de-codigo-de-prueba';
import { unaHojaValida } from '../../../../test/reclamos/fabricas/datos-de-hoja';
import {
  NoEncontradoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { SinDatosDelProveedorAdapter } from '../infraestructura/proveedor/sin-datos-del-proveedor.adapter';
import { MisHojasUseCase } from './mis-hojas.use-case';
import { RegistrarHojaUseCase } from './registrar-hoja.use-case';
import { ResponderHojaUseCase } from './responder-hoja.use-case';
import { SeguirHojaUseCase } from './seguir-hoja.use-case';

const JUGADOR = 12;
const OTRO_JUGADOR = 13;
const NO_ENCONTRADA =
  'No encontramos una hoja con ese número y código. Revisa los dos datos de la constancia.';

describe('seguimiento de las hojas', () => {
  let hojas: EnMemoriaHojaRepository;
  let reloj: RelojDePrueba;
  let registrar: RegistrarHojaUseCase;
  let seguir: SeguirHojaUseCase;
  let mias: MisHojasUseCase;

  beforeEach(() => {
    hojas = new EnMemoriaHojaRepository();
    reloj = new RelojDePrueba(new Date('2026-11-25T15:00:00.000Z'));
    registrar = new RegistrarHojaUseCase({
      hojas,
      generador: new GeneradorDeCodigoDePrueba(),
      proveedor: new SinDatosDelProveedorAdapter(),
      correos: new CorreosDePrueba(),
      reloj,
    });
    seguir = new SeguirHojaUseCase(hojas, reloj);
    mias = new MisHojasUseCase(hojas, reloj);
  });

  describe('SeguirHojaUseCase', () => {
    it('con número y código muestra el estado, el plazo y lo reclamado', async () => {
      await registrar.ejecutar(unaHojaValida(), null);
      reloj.avanzarMinutos(60 * 24 * 7);

      const seguimiento = await seguir.ejecutar('1-2026', 'k7qp-4zmd');

      expect(seguimiento).toEqual({
        numero: '000001-2026',
        tipo: 'RECLAMO',
        estado: 'NUEVA',
        registradaEn: new Date('2026-11-25T15:00:00.000Z'),
        fechaLimite: '2026-12-16',
        diasHabilesRestantes: 10,
        medioDeRespuesta: 'CORREO',
        servicio: {
          servicio: 'RESERVA_DE_CANCHA',
          montoReclamado: '40.00',
          descripcion: 'Turno del sábado 21, 20:30, Cancha 3',
        },
        detalle: 'La cancha estaba ocupada al llegar y no pudimos jugar.',
        pedido: 'Que devuelvan el adelanto completo.',
        abiertaEn: null,
        respuesta: null,
      });
    });

    it('una hoja respondida muestra la respuesta y ya no cuenta días', async () => {
      await registrar.ejecutar(unaHojaValida(), null);
      await new ResponderHojaUseCase({
        hojas,
        correos: new CorreosDePrueba(),
        reloj,
      }).ejecutar('000001-2026', { texto: 'Devolvimos el adelanto.' }, 3);

      const seguimiento = await seguir.ejecutar('000001-2026', 'K7QP4ZMD');

      expect(seguimiento).toMatchObject({
        estado: 'RESPONDIDA',
        diasHabilesRestantes: null,
        respuesta: {
          texto: 'Devolvimos el adelanto.',
          respondidaEn: reloj.ahora(),
        },
      });
    });

    it('no devuelve los datos personales de quien reclamó', async () => {
      await registrar.ejecutar(unaHojaValida(), null);

      const texto = JSON.stringify(
        await seguir.ejecutar('000001-2026', 'K7QP4ZMD'),
      );

      for (const dato of [
        '45871236',
        'América',
        '987654321',
        'gmail',
        'Valeria',
      ]) {
        expect(texto).not.toContain(dato);
      }
    });

    it('con un código que no coincide responde lo mismo que si la hoja no existiera', async () => {
      await registrar.ejecutar(unaHojaValida(), null);

      await expect(seguir.ejecutar('000001-2026', 'AAAA-AAAA')).rejects.toThrow(
        new NoEncontradoError(NO_ENCONTRADA),
      );
      await expect(seguir.ejecutar('000099-2026', 'K7QP-4ZMD')).rejects.toThrow(
        new NoEncontradoError(NO_ENCONTRADA),
      );
    });

    it('con número o código mal escritos dice qué corregir en cada uno', async () => {
      await expect(seguir.ejecutar('', 'x')).rejects.toThrow(
        ReglaInvalidaError,
      );
      await seguir.ejecutar('', 'x').catch((error: ReglaInvalidaError) => {
        expect(Object.keys(error.errores)).toEqual(['numero', 'codigo']);
      });
    });
  });

  describe('MisHojasUseCase', () => {
    it('lista las hojas del jugador, la más reciente primero, con un resumen', async () => {
      await registrar.ejecutar(unaHojaValida({ tipo: 'QUEJA' }), JUGADOR);
      await registrar.ejecutar(unaHojaValida(), OTRO_JUGADOR);
      await registrar.ejecutar(
        unaHojaValida({ detalle: 'a'.repeat(300) }),
        JUGADOR,
      );

      const lista = await mias.listar(JUGADOR);

      expect(lista.map((h) => [h.numero, h.tipo])).toEqual([
        ['000003-2026', 'RECLAMO'],
        ['000001-2026', 'QUEJA'],
      ]);
      expect(lista[0].resumen).toBe(`${'a'.repeat(140)}…`);
      expect(lista[0]).toMatchObject({
        estado: 'NUEVA',
        fechaLimite: '2026-12-16',
      });
    });

    it('muestra el detalle de una hoja propia y no el de una ajena', async () => {
      await registrar.ejecutar(unaHojaValida(), OTRO_JUGADOR);
      await registrar.ejecutar(unaHojaValida(), JUGADOR);

      expect((await mias.ver(JUGADOR, '000002-2026')).numero).toBe(
        '000002-2026',
      );
      await expect(mias.ver(JUGADOR, '000001-2026')).rejects.toThrow(
        NoEncontradoError,
      );
    });

    it('un número de hoja mal escrito en la dirección responde como no encontrada', async () => {
      await expect(mias.ver(JUGADOR, '9999999999-abc')).rejects.toThrow(
        NoEncontradoError,
      );
    });
  });
});
