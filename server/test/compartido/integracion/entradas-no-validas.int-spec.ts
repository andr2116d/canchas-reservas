import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unAdicionalValido } from '../../adicionales/fabricas/datos-adicional';
import { unaCanchaValida } from '../../canchas/fabricas/datos-cancha';
import { unJugadorValido } from '../../usuarios/fabricas/datos-registro-jugador';
import { crearAppDePrueba } from '../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../soporte/sesiones-de-prueba';

const NO_VALIDO = 'Quita los caracteres no válidos.';

describe('Entradas que intentan romper la API', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeAll(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterAll(() => app.close());

  const api = () => request(app.getHttpServer());

  it.each([
    ['el carácter nulo', 'Arco\u0000nuevo'],
    ['un carácter de control', 'Arco\u0007'],
    ['medio emoji suelto', 'Arco \ud83d'],
  ])('rechaza %s en un texto libre sin llegar a la base', async (_caso, nota) => {
    const respuesta = await api()
      .post('/api/canchas')
      .set('Cookie', administrador)
      .send({ canchas: [unaCanchaValida({ nota })] })
      .expect(400);

    expect(respuesta.body.errores).toEqual({ 'canchas.0.nota': NO_VALIDO });
    expect(await prisma.cancha.count()).toBe(0);
  });

  it('rechaza caracteres de control en la descripción de un adicional y en los nombres del jugador', async () => {
    const adicional = await api()
      .post('/api/adicionales')
      .set('Cookie', administrador)
      .send(unAdicionalValido({ descripcion: 'Talla\u0000M' }))
      .expect(400);
    const jugador = await api()
      .post('/api/jugadores')
      .send(unJugadorValido({ nombres: 'Ana\u0000' }))
      .expect(400);

    expect(adicional.body.errores).toEqual({ descripcion: NO_VALIDO });
    expect(jugador.body.errores).toEqual({ nombres: NO_VALIDO });
  });

  it('acepta saltos de línea y tildes en un texto libre', async () => {
    await api()
      .post('/api/adicionales')
      .set('Cookie', administrador)
      .send(unAdicionalValido({ nombre: 'Chaleco', descripcion: 'Talla M\ny L, ñandú' }))
      .expect(201);
  });

  it('solo lee JSON: un formulario o un texto plano no crean nada', async () => {
    await api()
      .post('/api/adicionales')
      .set('Cookie', administrador)
      .type('form')
      .send('nombre=Cono&precio=2')
      .expect(400);
    await api()
      .post('/api/adicionales')
      .set('Cookie', administrador)
      .set('Content-Type', 'text/plain')
      .send('{"nombre":"Cono","precio":"2"}')
      .expect(400);

    expect(await prisma.adicional.count({ where: { nombre: 'Cono' } })).toBe(0);
  });

  it('rechaza caracteres de control y valores fuera de la lista en los filtros', async () => {
    const control = await api()
      .get('/api/historial?desde=2026-01-01%00')
      .set('Cookie', administrador)
      .expect(400);
    const importantes = await api()
      .get('/api/historial?soloImportantes=quizas')
      .set('Cookie', administrador)
      .expect(400);

    expect(control.body.errores).toEqual({ desde: NO_VALIDO });
    expect(importantes.body.errores).toEqual({
      soloImportantes: 'Elige ver todos o solo los importantes.',
    });
  });
});
