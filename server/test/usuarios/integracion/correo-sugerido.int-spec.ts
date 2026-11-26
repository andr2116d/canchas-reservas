import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaRecepcionistaValida } from '../fabricas/datos-recepcionista';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

describe('GET /api/recepcionistas/correo-sugerido', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const sugerir = (nombres: string, apellidos: string) =>
    request(app.getHttpServer())
      .get('/api/recepcionistas/correo-sugerido')
      .query({ nombres, apellidos });

  it('sugiere el siguiente correo libre si el primero ya existe', async () => {
    await request(app.getHttpServer())
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida())
      .expect(201);

    const respuesta = await sugerir('Rosa Elena', 'Quispe Lozano')
      .set('Cookie', administrador)
      .expect(200);

    expect(respuesta.body).toEqual({ usuarioDeCorreo: 'rosa.quispe2' });
  });

  it('responde 400 si los nombres no permiten armar un correo', async () => {
    const respuesta = await sugerir('—', '—')
      .set('Cookie', administrador)
      .expect(400);

    expect(respuesta.body.errores).toEqual({
      correo: 'Escribe los nombres y apellidos para generar el correo.',
    });
  });

  it('responde 400 si falta un dato de la consulta', async () => {
    await request(app.getHttpServer())
      .get('/api/recepcionistas/correo-sugerido')
      .query({ nombres: 'Rosa' })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('responde 403 a un jugador', async () => {
    const jugador = await sesionDeJugador(app);

    await sugerir('Rosa', 'Quispe').set('Cookie', jugador).expect(403);
  });
});
