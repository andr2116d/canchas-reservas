import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { HISTORIAL_REPOSITORY } from '../../../src/modulos/historial/dominio/historial.repository';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

const RUTAS = ['/api/historial', '/api/historial/autores'];

describe('Historial de cambios · seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('sin sesión responde 401 y un jugador recibe 403', async () => {
    const jugador = await sesionDeJugador(app);

    for (const ruta of RUTAS) {
      await api().get(ruta).expect(401);
      await api().get(ruta).set('Cookie', jugador).expect(403);
    }
  });

  describe('con sesión de administración', () => {
    let administrador: string;
    beforeEach(async () => {
      administrador = await sesionDeAdministrador(app);
    });

    it('es de solo lectura: no hay forma de crear, editar ni borrar registros', async () => {
      for (const metodo of ['post', 'put', 'patch', 'delete'] as const) {
        await api()
          [metodo]('/api/historial')
          .set('Cookie', administrador)
          .expect(404);
        await api()
          [metodo]('/api/historial/acceso-1')
          .set('Cookie', administrador)
          .expect(404);
      }
    });

    it('rechaza filtros desconocidos y valores fuera de la lista, sin tocar la base', async () => {
      const { body } = await api()
        .get('/api/historial')
        .query({ categoria: "CANCHAS' OR 1=1 --", tabla: 'usuario' })
        .set('Cookie', administrador)
        .expect(400);

      expect(body.errores).toEqual({ tabla: 'Este campo no está permitido.' });
      const otra = await api()
        .get('/api/historial')
        .query({ categoria: "CANCHAS' OR 1=1 --" })
        .set('Cookie', administrador)
        .expect(400);
      expect(otra.body.errores).toEqual({
        categoria: 'Elige una categoría de la lista.',
      });
    });

    it('una persona o una página fuera de rango se rechaza con su motivo, sin error interno', async () => {
      const { body } = await api()
        .get('/api/historial')
        .query({ autor: '99999999999', pagina: '99999999999' })
        .set('Cookie', administrador)
        .expect(400);

      expect(Object.keys(body.errores)).toEqual(['autor', 'pagina']);
    });

    it('no expone ids internos, datos cifrados ni datos personales de las cuentas', async () => {
      const { body } = await api()
        .get('/api/historial')
        .set('Cookie', administrador)
        .expect(200);

      expect(Object.keys(body.registros[0]).sort()).toEqual([
        'accion',
        'autor',
        'categoria',
        'detalle',
        'id',
        'importante',
        'ocurridoEn',
        'sujeto',
      ]);
      expect(Object.keys(body.registros[0].autor).sort()).toEqual([
        'id',
        'nombre',
      ]);
      expect(JSON.stringify(body)).not.toMatch(
        /cifrado|hash|correo|documento/i,
      );
    });
  });

  it('un error interno responde 500 sin detalles', async () => {
    await app.close();
    ({ app, prisma } = await crearAppDePrueba((constructor) =>
      constructor.overrideProvider(HISTORIAL_REPOSITORY).useValue({
        buscar: () => Promise.reject(new Error('detalle interno secreto')),
      }),
    ));
    const administrador = await sesionDeAdministrador(app);

    const respuesta = await api()
      .get('/api/historial')
      .set('Cookie', administrador);

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toContain('secreto');
  });
});
