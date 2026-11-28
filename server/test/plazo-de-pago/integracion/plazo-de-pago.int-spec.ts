import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

describe('Plazo para pagar el adelanto', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const definir = (datos: object = { minutos: '30' }) =>
    api().put('/api/plazo-de-pago').send(datos);

  it('sin plazo guardado dice que rigen 15 minutos por defecto', async () => {
    const { body } = await api()
      .get('/api/plazo-de-pago')
      .set('Cookie', administrador)
      .expect(200);

    expect(body).toEqual({ historial: [], porDefecto: 15 });
  });

  it('el administrador define el plazo y queda una versión con quién lo guardó', async () => {
    const { body } = await definir().set('Cookie', administrador).expect(200);

    expect(body.cambio).toBe(true);
    expect(body.vigente).toMatchObject({
      minutos: 30,
      guardadaPor: 'Valeria León Paredes',
    });
    expect(await prisma.plazoDePago.count()).toBe(1);
  });

  it('guardar lo mismo, aunque sea al mismo tiempo, no crea otra versión; un cambio sí', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => definir().set('Cookie', administrador)),
    );
    await definir({ minutos: '45' }).set('Cookie', administrador).expect(200);

    const { body } = await api()
      .get('/api/plazo-de-pago')
      .set('Cookie', administrador)
      .expect(200);

    expect(body.vigente.minutos).toBe(45);
    expect(body.historial.map((v: { minutos: number }) => v.minutos)).toEqual([
      45, 30,
    ]);
  });

  it('rechaza minutos fuera de rango, sin guardar nada', async () => {
    const { body } = await definir({ minutos: '1441' })
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores).toEqual({
      minutos: 'Usa un número entero de minutos, de 1 a 1440.',
    });
    expect(await prisma.plazoDePago.count()).toBe(0);
  });

  it('responde 400 a campos de más y a minutos que no llegan como texto', async () => {
    await definir({ minutos: '30', activo: true })
      .set('Cookie', administrador)
      .expect(400);
    await definir({ minutos: 30 }).set('Cookie', administrador).expect(400);
    await definir({}).set('Cookie', administrador).expect(400);
  });

  it('solo administración consulta y define el plazo', async () => {
    const jugador = await sesionDeJugador(app);

    await definir().set('Cookie', jugador).expect(403);
    await api().get('/api/plazo-de-pago').set('Cookie', jugador).expect(403);
    await definir().expect(401);
  });

  it('la base también rechaza minutos fuera de rango', async () => {
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'ADMINISTRADOR' },
    });

    await expect(
      prisma.plazoDePago.create({
        data: { minutos: 1441, guardadoPorId: admin.id },
      }),
    ).rejects.toThrow();
  });
});
