import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { ADICIONAL_REPOSITORY } from '../../../src/modulos/adicionales/dominio/adicional.repository';
import { unAdicionalValido } from '../fabricas/datos-adicional';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

type Metodo = 'get' | 'post' | 'put' | 'delete';
const RUTAS: [Metodo, string][] = [
  ['get', '/api/adicionales'],
  ['get', '/api/adicionales/cambios'],
  ['post', '/api/adicionales'],
  ['put', '/api/adicionales/1'],
  ['post', '/api/adicionales/1/desactivacion'],
  ['post', '/api/adicionales/1/reactivacion'],
  ['delete', '/api/adicionales/1'],
];

describe('Adicionales · seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('sin sesión responde 401 en cada ruta', async () => {
    for (const [metodo, ruta] of RUTAS) {
      await api()[metodo](ruta).expect(401);
    }
  });

  it('un jugador recibe 403 en cada ruta', async () => {
    const jugador = await sesionDeJugador(app);

    for (const [metodo, ruta] of RUTAS) {
      await api()[metodo](ruta).set('Cookie', jugador).expect(403);
    }
  });

  describe('con sesión de administración', () => {
    let administrador: string;
    beforeEach(async () => {
      administrador = await sesionDeAdministrador(app);
    });
    const registrar = (cuerpo: object) =>
      api().post('/api/adicionales').set('Cookie', administrador).send(cuerpo);

    it('rechaza campos que no forman parte del adicional, como el estado o el id', async () => {
      const { body } = await registrar({
        ...unAdicionalValido(),
        estado: 'DESACTIVADO',
        id: 5,
      }).expect(400);

      expect(body.errores).toEqual({
        estado: 'Este campo no está permitido.',
        id: 'Este campo no está permitido.',
      });
    });

    it('rechaza el precio como número y marcas de HTML en el nombre', async () => {
      const { body } = await registrar({
        nombre: '<img src=x>',
        precio: 45,
      }).expect(400);

      expect(Object.keys(body.errores)).toEqual(['precio']);
      const conHtml = await registrar(
        unAdicionalValido({ nombre: '<img src=x>' }),
      ).expect(400);
      expect(Object.keys(conHtml.body.errores)).toEqual(['nombre']);
    });

    it('la base rechaza un precio de cero aunque se salte la aplicación', async () => {
      await expect(
        prisma.adicional.create({
          data: { nombre: 'Balón', nombreNormalizado: 'balon', precio: 0 },
        }),
      ).rejects.toThrow();
    });

    it('la respuesta no expone campos internos', async () => {
      await registrar(unAdicionalValido()).expect(201);

      const { body } = await api()
        .get('/api/adicionales')
        .set('Cookie', administrador)
        .expect(200);

      expect(Object.keys(body[0]).sort()).toEqual([
        'descripcion',
        'estado',
        'id',
        'nombre',
        'precio',
        'sePuedeEliminar',
      ]);
    });
  });

  it('un error interno responde 500 sin detalles', async () => {
    await app.close();
    ({ app, prisma } = await crearAppDePrueba((constructor) =>
      constructor.overrideProvider(ADICIONAL_REPOSITORY).useValue({
        listar: () => Promise.reject(new Error('detalle interno secreto')),
      }),
    ));
    const administrador = await sesionDeAdministrador(app);

    const respuesta = await api()
      .get('/api/adicionales')
      .set('Cookie', administrador);

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toContain('secreto');
  });
});
