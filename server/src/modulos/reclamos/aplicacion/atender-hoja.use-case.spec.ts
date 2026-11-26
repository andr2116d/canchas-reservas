import { AvisosDePrueba } from '../../../../test/avisos/dobles/avisos-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { CorreosDePrueba } from '../../../../test/correo/dobles/correos-de-prueba';
import { EnMemoriaHojaRepository } from '../../../../test/reclamos/dobles/en-memoria-hoja.repository';
import { GeneradorDeCodigoDePrueba } from '../../../../test/reclamos/dobles/generador-de-codigo-de-prueba';
import {
  unaHojaValida,
  unRepresentante,
} from '../../../../test/reclamos/fabricas/datos-de-hoja';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../compartido/dominio/dominio.error';
import { SinDatosDelProveedorAdapter } from '../infraestructura/proveedor/sin-datos-del-proveedor.adapter';
import {
  AbrirHojaUseCase,
  ClasificarHojaUseCase,
  TramitarComoReclamoUseCase,
} from './atender-hoja.use-case';
import { ConsultarHojasUseCase } from './consultar-hojas.use-case';
import { RegistrarHojaUseCase } from './registrar-hoja.use-case';
import { ResponderHojaUseCase } from './responder-hoja.use-case';
import { VerHojaUseCase } from './ver-hoja.use-case';

const ADMINISTRACION = 3;
const NUMERO = '000001-2026';

describe('atención de las hojas por administración', () => {
  let hojas: EnMemoriaHojaRepository;
  let correos: CorreosDePrueba;
  let reloj: RelojDePrueba;
  let registrar: RegistrarHojaUseCase;
  let avisos: AvisosDePrueba;

  beforeEach(() => {
    hojas = new EnMemoriaHojaRepository();
    correos = new CorreosDePrueba();
    reloj = new RelojDePrueba(new Date('2026-11-25T15:00:00.000Z'));
    const proveedor = new SinDatosDelProveedorAdapter();
    avisos = new AvisosDePrueba();
    registrar = new RegistrarHojaUseCase({
      hojas,
      generador: new GeneradorDeCodigoDePrueba(),
      proveedor,
      correos,
      avisos,
      reloj,
    });
  });

  const nuevas = (
    cambios: Parameters<typeof unaHojaValida>[0] = {},
    titularId: number | null = null,
  ) => registrar.ejecutar(unaHojaValida(cambios), titularId);
  const dias = (n: number) => reloj.avanzarMinutos(n * 24 * 60);

  describe('ConsultarHojasUseCase', () => {
    it('por defecto lista las por responder, la que vence primero arriba, con los conteos', async () => {
      await nuevas();
      dias(1);
      await nuevas({ tipo: 'QUEJA' });
      await new ResponderHojaUseCase({
        hojas,
        correos,
        avisos,
        reloj,
      }).ejecutar(NUMERO, { texto: 'Listo.' }, ADMINISTRACION);

      const pagina = await new ConsultarHojasUseCase(hojas, reloj).ejecutar({});

      expect(pagina.hojas.map((h) => h.numero)).toEqual(['000002-2026']);
      expect(pagina).toMatchObject({ total: 1, pagina: 1, porPagina: 25 });
      expect(pagina.conteos).toMatchObject({
        POR_RESPONDER: 1,
        RESPONDIDA: 1,
        TODAS: 2,
      });
      expect(pagina.hojas[0]).toMatchObject({
        tipo: 'QUEJA',
        estado: 'NUEVA',
        motivo: null,
        nombre: 'Valeria León Paredes',
        fechaLimite: '2026-12-17',
        diasHabilesRestantes: 15,
        vencida: false,
      });
    });

    it('las vencidas son las por responder con la fecha límite pasada', async () => {
      await nuevas();
      dias(30);
      await nuevas();

      const pagina = await new ConsultarHojasUseCase(hojas, reloj).ejecutar({
        estado: 'VENCIDAS',
      });

      expect(
        pagina.hojas.map((h) => [h.numero, h.vencida, h.diasHabilesRestantes]),
      ).toEqual([['000001-2026', true, -7]]);
    });
  });

  describe('VerHojaUseCase', () => {
    it('muestra la hoja completa, con los datos de la persona y su registro de cambios', async () => {
      await nuevas({ esMenorDeEdad: true, ...unRepresentante() });
      await new AbrirHojaUseCase(hojas, reloj).ejecutar(NUMERO, ADMINISTRACION);

      const vista = await new VerHojaUseCase(hojas, reloj).ejecutar(NUMERO);

      expect(vista).toMatchObject({
        numero: NUMERO,
        estado: 'EN_ATENCION',
        consumidor: { documento: { tipo: 'DNI', numero: '45871236' } },
        representante: { nombre: 'Rosa Paredes Díaz' },
        respuesta: null,
        cambios: [{ accion: 'APERTURA', ejecutadoPor: 'Persona 3' }],
      });
    });

    it('una hoja que no existe responde no encontrada', async () => {
      await expect(
        new VerHojaUseCase(hojas, reloj).ejecutar('000009-2026'),
      ).rejects.toThrow(NoEncontradoError);
      await expect(
        new VerHojaUseCase(hojas, reloj).ejecutar('x'),
      ).rejects.toThrow(NoEncontradoError);
    });
  });

  describe('AbrirHojaUseCase', () => {
    it('la primera apertura queda en la auditoría; las siguientes no', async () => {
      await nuevas();
      const abrir = new AbrirHojaUseCase(hojas, reloj);

      await abrir.ejecutar(NUMERO, ADMINISTRACION);
      await abrir.ejecutar(NUMERO, 4);

      expect(hojas.auditoria.map((c) => [c.accion, c.ejecutadoPorId])).toEqual([
        ['APERTURA', ADMINISTRACION],
      ]);
    });
  });

  describe('ClasificarHojaUseCase y TramitarComoReclamoUseCase', () => {
    it('clasifica con el antes y el después, y repetir el mismo motivo no deja registro', async () => {
      await nuevas();
      const clasificar = new ClasificarHojaUseCase(hojas, reloj);

      await clasificar.ejecutar(NUMERO, 'ESTADO_DE_LA_CANCHA', ADMINISTRACION);
      await clasificar.ejecutar(NUMERO, 'ESTADO_DE_LA_CANCHA', ADMINISTRACION);

      expect(hojas.auditoria).toEqual([
        expect.objectContaining({
          accion: 'CLASIFICACION',
          detalle: { antes: null, despues: 'ESTADO_DE_LA_CANCHA' },
        }),
      ]);
    });

    it('tramita una queja como reclamo y lo deja en la auditoría', async () => {
      await nuevas({ tipo: 'QUEJA' });

      await new TramitarComoReclamoUseCase(hojas, reloj).ejecutar(
        NUMERO,
        ADMINISTRACION,
      );

      expect((await hojas.buscar(hojas.guardadas[0].numero))?.tipo).toBe(
        'RECLAMO',
      );
      expect(hojas.auditoria[0]).toMatchObject({
        accion: 'CAMBIO_DE_TIPO',
        detalle: { antes: 'QUEJA', despues: 'RECLAMO' },
      });
    });
  });

  describe('ResponderHojaUseCase', () => {
    it('por correo guarda la respuesta y la envía a quien reclamó y a quien lo representa', async () => {
      await nuevas({ esMenorDeEdad: true, ...unRepresentante() });
      correos.enviados.length = 0;

      await new ResponderHojaUseCase({
        hojas,
        correos,
        avisos,
        reloj,
      }).ejecutar(NUMERO, { texto: 'Devolvimos el adelanto.' }, ADMINISTRACION);

      expect(hojas.auditoria[0]).toMatchObject({
        accion: 'RESPUESTA',
        detalle: { medio: 'CORREO', fueraDePlazo: false },
        ejecutadoPorId: ADMINISTRACION,
      });
      expect(correos.enviados.map((c) => [c.para, c.asunto])).toEqual([
        [
          'valeria.leon@gmail.com',
          `Respuesta a tu hoja de reclamación N.º ${NUMERO}`,
        ],
        [
          'rosa.paredes@gmail.com',
          `Respuesta a tu hoja de reclamación N.º ${NUMERO}`,
        ],
      ]);
      expect(correos.enviados[0].texto).toContain('Devolvimos el adelanto.');
    });

    it('por carta guarda la fecha de envío y no envía correos', async () => {
      await nuevas({ medioDeRespuesta: 'CARTA' });
      correos.enviados.length = 0;

      await new ResponderHojaUseCase({
        hojas,
        correos,
        avisos,
        reloj,
      }).ejecutar(
        NUMERO,
        { texto: 'Respuesta.', cartaEnviadaEl: '2026-11-25' },
        ADMINISTRACION,
      );

      expect(correos.enviados).toHaveLength(0);
      expect(
        (await hojas.buscar(hojas.guardadas[0].numero))?.respuesta
          ?.cartaEnviadaEl,
      ).toBe('2026-11-25');
    });

    it('una hoja respondida no se vuelve a responder', async () => {
      await nuevas();
      const responder = new ResponderHojaUseCase({
        hojas,
        correos,
        avisos,
        reloj,
      });
      await responder.ejecutar(NUMERO, { texto: 'Una.' }, ADMINISTRACION);

      await expect(
        responder.ejecutar(NUMERO, { texto: 'Otra.' }, ADMINISTRACION),
      ).rejects.toThrow(ConflictoError);
    });
  });

  describe('avisos al responder', () => {
    it('avisa al jugador que registró la hoja con su cuenta', async () => {
      await nuevas({}, 12);
      avisos.enviados.length = 0;

      await new ResponderHojaUseCase({
        hojas,
        correos,
        avisos,
        reloj,
      }).ejecutar(NUMERO, { texto: 'Listo.' }, ADMINISTRACION);

      expect(avisos.enviados).toEqual([
        { para: 12, tipo: 'RECLAMO_RESPONDIDO', referencia: NUMERO },
      ]);
    });

    it('si la hoja se registró sin cuenta no hay a quién avisar en la web', async () => {
      await nuevas();
      avisos.enviados.length = 0;

      await new ResponderHojaUseCase({
        hojas,
        correos,
        avisos,
        reloj,
      }).ejecutar(NUMERO, { texto: 'Listo.' }, ADMINISTRACION);

      expect(avisos.enviados).toEqual([]);
    });
  });
});
