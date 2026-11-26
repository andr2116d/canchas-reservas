import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { unaHojaValida } from '../fabricas/datos-de-hoja';

const RUTA = '/api/libro-de-reclamaciones';
const ANIO = fechaEnLima(new Date()).slice(0, 4);
const NO_ENCONTRADA =
  'No encontramos una hoja con ese número y código. Revisa los dos datos de la constancia.';

describe('seguimiento y «Mis reclamos»', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const registrar = async (cookie?: string) => {
    const pedido = api().post(RUTA);
    if (cookie) pedido.set('Cookie', cookie);
    return (await pedido.send(unaHojaValida())).body as {
      numero: string;
      codigo: string;
    };
  };
  const seguir = (cuerpo: object) =>
    api().post(`${RUTA}/seguimiento`).send(cuerpo);

  describe('POST /api/libro-de-reclamaciones/seguimiento', () => {
    it('con el número y el código de la constancia muestra el estado y el plazo', async () => {
      const { numero, codigo } = await registrar();

      const respuesta = await seguir({ numero, codigo: codigo.toLowerCase() });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({
        numero,
        estado: 'NUEVA',
        tipo: 'RECLAMO',
        diasHabilesRestantes: expect.any(Number),
      });
      expect(JSON.stringify(respuesta.body)).not.toMatch(
        /45871236|América|987654321|gmail/,
      );
    });

    it('un código equivocado responde igual que un número que no existe', async () => {
      const { numero } = await registrar();

      const equivocado = await seguir({ numero, codigo: 'AAAA-AAAA' });
      const inexistente = await seguir({
        numero: `000099-${ANIO}`,
        codigo: 'AAAA-AAAA',
      });

      expect([equivocado.status, inexistente.status]).toEqual([404, 404]);
      expect(equivocado.body.mensaje).toBe(NO_ENCONTRADA);
      expect(inexistente.body.mensaje).toBe(NO_ENCONTRADA);
    });

    it('número o código mal escritos responden 400 con el error de cada uno', async () => {
      const respuesta = await seguir({ numero: 'abc', codigo: '12' });

      expect(respuesta.status).toBe(400);
      expect(Object.keys(respuesta.body.errores)).toEqual(['numero', 'codigo']);
    });

    it('limita los intentos desde una misma IP', async () => {
      for (let i = 0; i < 10; i++) {
        await seguir({ numero: `000001-${ANIO}`, codigo: 'AAAA-AAAA' });
      }

      expect(
        (await seguir({ numero: `000001-${ANIO}`, codigo: 'AAAA-AAAA' }))
          .status,
      ).toBe(429);
    });
  });

  describe('GET /api/libro-de-reclamaciones/mis-hojas', () => {
    it('sin sesión responde 401 y con una cuenta del personal 403', async () => {
      const administracion = await sesionDeAdministrador(app);

      expect((await api().get(`${RUTA}/mis-hojas`)).status).toBe(401);
      expect(
        (await api().get(`${RUTA}/mis-hojas`).set('Cookie', administracion))
          .status,
      ).toBe(403);
    });

    it('el jugador ve solo las hojas que registró con su cuenta', async () => {
      const jugador = await sesionDeJugador(app);
      const suya = await registrar(jugador);
      await registrar();

      const respuesta = await api()
        .get(`${RUTA}/mis-hojas`)
        .set('Cookie', jugador);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.map((h: { numero: string }) => h.numero)).toEqual([
        suya.numero,
      ]);
    });

    it('abre una hoja propia y responde 404 para una ajena o un número mal escrito', async () => {
      const jugador = await sesionDeJugador(app);
      const suya = await registrar(jugador);
      const ajena = await registrar();
      const ver = (numero: string) =>
        api()
          .get(`${RUTA}/mis-hojas/${encodeURIComponent(numero)}`)
          .set('Cookie', jugador);

      expect((await ver(suya.numero)).status).toBe(200);
      expect((await ver(ajena.numero)).status).toBe(404);
      expect((await ver('99999999999999-2026')).status).toBe(404);
      expect((await ver('-1')).status).toBe(404);
    });
  });
});
