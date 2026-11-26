import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { CANCHA_REPOSITORY } from '../../../src/modulos/canchas/dominio/cancha.repository';
import { unaCanchaValida } from '../fabricas/datos-cancha';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

type Metodo = 'get' | 'post' | 'put' | 'delete';
const RUTAS: [Metodo, string][] = [
  ['get', '/api/canchas'],
  ['get', '/api/canchas/cambios'],
  ['post', '/api/canchas'],
  ['put', '/api/canchas/1'],
  ['post', '/api/canchas/1/desactivacion'],
  ['post', '/api/canchas/1/reactivacion'],
  ['delete', '/api/canchas/1'],
];

describe('Canchas · seguridad', () => {
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
      api().post('/api/canchas').set('Cookie', administrador).send(cuerpo);

    it('rechaza campos que no forman parte de la cancha, como el estado o el id', async () => {
      const { body } = await registrar({
        canchas: [{ ...unaCanchaValida(), estado: 'DESACTIVADA', id: 5 }],
      }).expect(400);

      expect(body.errores).toEqual({
        'canchas.0.estado': 'Este campo no está permitido.',
        'canchas.0.id': 'Este campo no está permitido.',
      });
    });

    it('rechaza marcas de HTML en el nombre y detalles fuera de la lista', async () => {
      const { body } = await registrar({
        canchas: [
          unaCanchaValida({
            nombre: '<script>alert(1)</script>',
            caracteristicas: ['PISCINA'],
          }),
        ],
      }).expect(400);

      expect(Object.keys(body.errores)).toEqual([
        'canchas.0.nombre',
        'canchas.0.caracteristicas',
      ]);
    });

    it('limita cuántas canchas se crean de una vez', async () => {
      const canchas = Array.from({ length: 21 }, (_, i) =>
        unaCanchaValida({ nombre: `Cancha ${i + 1}` }),
      );

      const { body } = await registrar({ canchas }).expect(400);

      expect(body.errores).toEqual({
        canchas: 'Agrega como máximo 20 canchas a la vez.',
      });
    });

    it('la respuesta no expone campos internos', async () => {
      await registrar({ canchas: [unaCanchaValida()] }).expect(201);

      const { body } = await api()
        .get('/api/canchas')
        .set('Cookie', administrador)
        .expect(200);

      expect(Object.keys(body[0]).sort()).toEqual([
        'caracteristicas',
        'estado',
        'id',
        'mantenimiento',
        'nombre',
        'nota',
        'proximoMantenimiento',
        'sePuedeEliminar',
        'tieneIluminacion',
        'tipo',
      ]);
    });
  });

  it('un error interno responde 500 sin detalles', async () => {
    await app.close();
    ({ app, prisma } = await crearAppDePrueba((constructor) =>
      constructor.overrideProvider(CANCHA_REPOSITORY).useValue({
        listar: () => Promise.reject(new Error('detalle interno secreto')),
      }),
    ));
    const administrador = await sesionDeAdministrador(app);

    const respuesta = await api()
      .get('/api/canchas')
      .set('Cookie', administrador);

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toContain('secreto');
  });
});
