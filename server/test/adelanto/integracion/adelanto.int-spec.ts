import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

describe('Adelanto mínimo', () => {
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
  const definir = (datos: object = { porcentaje: '50' }) =>
    api().put('/api/adelanto').send(datos);

  it('sin adelanto guardado propone 50 % y no hay vigente', async () => {
    const { body } = await api()
      .get('/api/adelanto')
      .set('Cookie', administrador)
      .expect(200);

    expect(body).toEqual({ historial: [], propuesta: 50 });
  });

  it('el administrador define el adelanto y queda una versión con quién lo guardó', async () => {
    const { body } = await definir().set('Cookie', administrador).expect(200);

    expect(body.cambio).toBe(true);
    expect(body.vigente).toMatchObject({
      porcentaje: 50,
      guardadaPor: 'Valeria León Paredes',
    });
    expect(await prisma.adelantoMinimo.count()).toBe(1);
  });

  it('guardar lo mismo, aunque sea al mismo tiempo, no crea otra versión; un cambio sí', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => definir().set('Cookie', administrador)),
    );
    await definir({ porcentaje: '40' })
      .set('Cookie', administrador)
      .expect(200);

    const { body } = await api()
      .get('/api/adelanto')
      .set('Cookie', administrador)
      .expect(200);

    expect(body.vigente.porcentaje).toBe(40);
    expect(
      body.historial.map((v: { porcentaje: number }) => v.porcentaje),
    ).toEqual([40, 50]);
  });

  it('rechaza un porcentaje fuera de rango, sin guardar nada', async () => {
    const { body } = await definir({ porcentaje: '101' })
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores).toEqual({
      porcentaje: 'Usa un número entero de 1 a 100.',
    });
    expect(await prisma.adelantoMinimo.count()).toBe(0);
  });

  it('responde 400 a campos de más y a un porcentaje que no llega como texto', async () => {
    await definir({ porcentaje: '50', activo: true })
      .set('Cookie', administrador)
      .expect(400);
    await definir({ porcentaje: 50 }).set('Cookie', administrador).expect(400);
    await definir({}).set('Cookie', administrador).expect(400);
  });

  it('solo administración consulta y define el adelanto', async () => {
    const jugador = await sesionDeJugador(app);

    await definir().set('Cookie', jugador).expect(403);
    await api().get('/api/adelanto').set('Cookie', jugador).expect(403);
    await definir().expect(401);
  });

  it('la base también rechaza un porcentaje fuera de rango', async () => {
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'ADMINISTRADOR' },
    });

    await expect(
      prisma.adelantoMinimo.create({
        data: { porcentaje: 0, guardadoPorId: admin.id },
      }),
    ).rejects.toThrow();
  });
});
