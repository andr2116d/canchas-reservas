import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { esperarCorreos } from '../../compartido/soporte/bandeja-de-mailpit';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../compartido/soporte/sesiones-de-prueba';
import { unaHojaValida } from '../fabricas/datos-de-hoja';

const HOY = fechaEnLima(new Date());
const ANIO = HOY.slice(0, 4);
const PRIMERA = `000001-${ANIO}`;

describe('atención de las hojas por administración', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administracion: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administracion = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const registrar = (cambios: Parameters<typeof unaHojaValida>[0] = {}) =>
    api().post('/api/libro-de-reclamaciones').send(unaHojaValida(cambios));
  const como = <T extends request.Test>(pedido: T) =>
    pedido.set('Cookie', administracion);

  it('lista las por responder con los conteos de cada estado y el nombre de quien reclamó', async () => {
    await registrar();
    await registrar({ tipo: 'QUEJA', nombres: 'Rosa' });

    const respuesta = await como(api().get('/api/reclamos'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      total: 2,
      pagina: 1,
      porPagina: 25,
    });
    expect(respuesta.body.conteos).toMatchObject({
      POR_RESPONDER: 2,
      NUEVA: 2,
      TODAS: 2,
    });
    expect(
      respuesta.body.hojas.map((h: { nombre: string }) => h.nombre),
    ).toEqual(['Valeria León Paredes', 'Rosa León Paredes']);
  });

  it('filtra por tipo, motivo sin clasificar y número', async () => {
    await registrar();
    await registrar({ tipo: 'QUEJA' });
    await como(api().put(`/api/reclamos/${PRIMERA}/motivo`)).send({
      motivo: 'OTRO',
    });

    const quejas = await como(
      api().get('/api/reclamos').query({ tipo: 'QUEJA' }),
    );
    const sinMotivo = await como(
      api().get('/api/reclamos').query({ motivo: 'SIN_MOTIVO' }),
    );
    const porNumero = await como(
      api()
        .get('/api/reclamos')
        .query({ numero: `2-${ANIO}` }),
    );

    expect(quejas.body.hojas.map((h: { tipo: string }) => h.tipo)).toEqual([
      'QUEJA',
    ]);
    expect(sinMotivo.body.total).toBe(1);
    expect(porNumero.body.hojas[0].numero).toBe(`000002-${ANIO}`);
  });

  it('al abrirla pasa a «en atención» una sola vez, aunque se abra a la vez desde dos pantallas', async () => {
    await registrar();

    const [una, otra] = await Promise.all([
      como(api().post(`/api/reclamos/${PRIMERA}/apertura`)),
      como(api().post(`/api/reclamos/${PRIMERA}/apertura`)),
    ]);

    expect([una.status, otra.status]).toEqual([200, 200]);
    expect(otra.body).toMatchObject({
      estado: 'EN_ATENCION',
      cambios: [{ accion: 'APERTURA' }],
    });
    expect(await prisma.cambioDeHoja.count()).toBe(1);
  });

  it('muestra la hoja completa con los datos de quien reclamó', async () => {
    await registrar();

    const respuesta = await como(api().get(`/api/reclamos/${PRIMERA}`));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      numero: PRIMERA,
      consumidor: {
        documento: { numero: '45871236' },
        domicilio: 'Av. América Sur 1250, Trujillo',
      },
      respuesta: null,
    });
  });

  it('tramita una queja como reclamo y no deja hacerlo dos veces', async () => {
    await registrar({ tipo: 'QUEJA' });

    const primera = await como(
      api().post(`/api/reclamos/${PRIMERA}/tramite-como-reclamo`),
    );
    const segunda = await como(
      api().post(`/api/reclamos/${PRIMERA}/tramite-como-reclamo`),
    );

    expect(primera.body).toMatchObject({
      tipo: 'RECLAMO',
      tipoMarcado: 'QUEJA',
    });
    expect(segunda.status).toBe(409);
  });

  it('responde por correo: la guarda cifrada, la envía y el seguimiento la muestra', async () => {
    const correo = `reclama.${randomUUID()}@gmail.com`;
    const { body: constancia } = await registrar({ correo });

    const respuesta = await como(
      api().post(`/api/reclamos/${PRIMERA}/respuesta`),
    ).send({
      texto: 'Devolvimos el adelanto de S/ 40.00.',
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      estado: 'RESPONDIDA',
      fueraDePlazo: false,
    });
    const fila = await prisma.hojaDeReclamacion.findFirstOrThrow();
    expect(fila.respuestaCifrada).not.toContain('Devolvimos');
    const correos = await esperarCorreos(correo, 2);
    expect(correos.map((c) => c.asunto)).toContain(
      `Respuesta a tu hoja de reclamación N.º ${PRIMERA}`,
    );
    const seguimiento = await api()
      .post('/api/libro-de-reclamaciones/seguimiento')
      .send({ numero: PRIMERA, codigo: constancia.codigo });
    expect(seguimiento.body.respuesta.texto).toBe(
      'Devolvimos el adelanto de S/ 40.00.',
    );
  });

  it('dos respuestas a la vez: una queda y la otra recibe 409, nunca un error del servidor', async () => {
    await registrar();

    const respuestas = await Promise.all(
      ['Una.', 'Otra.'].map((texto) =>
        como(api().post(`/api/reclamos/${PRIMERA}/respuesta`)).send({ texto }),
      ),
    );

    expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      200, 409,
    ]);
    expect(
      await prisma.cambioDeHoja.count({ where: { accion: 'RESPUESTA' } }),
    ).toBe(1);
  });

  it('por carta exige la fecha de envío y no envía correos', async () => {
    await registrar({ medioDeRespuesta: 'CARTA' });

    const sinFecha = await como(
      api().post(`/api/reclamos/${PRIMERA}/respuesta`),
    ).send({
      texto: 'Respuesta.',
    });
    const conFecha = await como(
      api().post(`/api/reclamos/${PRIMERA}/respuesta`),
    ).send({
      texto: 'Respuesta.',
      cartaEnviadaEl: HOY,
    });

    expect(sinFecha.status).toBe(400);
    expect(sinFecha.body.errores.cartaEnviadaEl).toBe(
      'Ingresa la fecha en que se envió la carta.',
    );
    expect(conFecha.body.respuesta).toMatchObject({ cartaEnviadaEl: HOY });
  });
});
