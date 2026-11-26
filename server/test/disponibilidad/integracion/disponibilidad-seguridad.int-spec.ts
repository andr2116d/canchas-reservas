import type { NestExpressApplication } from '@nestjs/platform-express';
import type { TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { OCUPACION_DEL_DIA } from '../../../src/modulos/disponibilidad/aplicacion/ocupacion-del-dia.port';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';

describe('Disponibilidad pública: seguridad', () => {
  let app: NestExpressApplication;

  afterEach(() => app.close());

  async function levantar(
    ajustar = (constructor: TestingModuleBuilder) => constructor,
  ) {
    const creada = await crearAppDePrueba(ajustar);
    app = creada.app;
    await limpiarTablas(creada.prisma);
  }
  const api = () => request(app.getHttpServer());

  it('es pública a propósito: responde sin sesión y no pide ni deja cookies', async () => {
    await levantar();

    const respuesta = await api().get('/api/disponibilidad').expect(200);

    expect(respuesta.headers['set-cookie']).toBeUndefined();
  });

  it('solo se consulta: no acepta escribir', async () => {
    await levantar();

    await api().post('/api/disponibilidad').send({}).expect(404);
    await api().delete('/api/disponibilidad').expect(404);
  });

  it('rechaza parámetros de más y texto con caracteres de control', async () => {
    await levantar();

    await api().get('/api/disponibilidad').query({ canchaId: '1' }).expect(400);
    const { body } = await api()
      .get('/api/disponibilidad')
      .query({ fecha: '2026\u0000-12' })
      .expect(400);

    expect(body.errores).toHaveProperty('fecha');
  });

  it('muchas consultas a la vez responden todas sin errores', async () => {
    await levantar();

    const respuestas = await Promise.all(
      Array.from({ length: 20 }, () => api().get('/api/disponibilidad')),
    );

    expect(new Set(respuestas.map((r) => r.status))).toEqual(new Set([200]));
  });

  it('una falla al leer la base responde 500 sin detalles', async () => {
    await levantar((constructor) =>
      constructor.overrideProvider(OCUPACION_DEL_DIA).useValue({
        canchasOperativas: () =>
          Promise.reject(new Error('relation "cancha" does not exist')),
        entre: () => Promise.reject(new Error('sin conexión')),
      }),
    );

    const { body, text } = await api().get('/api/disponibilidad').expect(500);

    expect(body.mensaje).toBeDefined();
    expect(text).not.toContain('relation');
  });
});
