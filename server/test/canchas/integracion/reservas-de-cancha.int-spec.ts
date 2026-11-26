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
import { guardarReserva } from '../../reservas/fabricas/reserva-de-prueba';
import { unBloqueoValido } from '../fabricas/datos-bloqueo';
import { unaCanchaValida } from '../fabricas/datos-cancha';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const dentroDe = (dias: number) =>
  fechaEnLima(new Date(Date.now() + dias * MS_POR_DIA));

describe('Canchas con reservas guardadas', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let canchaId: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    await sesionDeJugador(app);
    const { body } = await api()
      .post('/api/canchas')
      .set('Cookie', administrador)
      .send({ canchas: [unaCanchaValida({ nombre: 'Cancha 1' })] })
      .expect(201);
    canchaId = body[0].id as number;
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const desactivar = () =>
    api()
      .post(`/api/canchas/${canchaId}/desactivacion`)
      .set('Cookie', administrador);

  it('no desactiva una cancha con una reserva por jugar y nombra al titular', async () => {
    await guardarReserva(prisma, {
      canchaId,
      inicio: `${dentroDe(2)}T19:00:00-05:00`,
      estado: 'PENDIENTE_DE_PAGO',
    });

    const { body } = await desactivar().expect(409);

    expect(body.datos.reservas).toEqual([
      expect.objectContaining({ titular: 'Valeria León Paredes' }),
    ]);
  });

  it('una reserva que ya terminó no impide desactivar, pero sí eliminar', async () => {
    await guardarReserva(prisma, {
      canchaId,
      inicio: `${dentroDe(-2)}T19:00:00-05:00`,
    });

    await api()
      .delete(`/api/canchas/${canchaId}`)
      .set('Cookie', administrador)
      .expect(409);
    await desactivar().expect(204);
  });

  it('un bloqueo programado que choca con una reserva no se guarda y la lista', async () => {
    await guardarReserva(prisma, {
      canchaId,
      inicio: `${dentroDe(3)}T10:00:00-05:00`,
    });

    const { body } = await api()
      .post('/api/bloqueos')
      .set('Cookie', administrador)
      .send(
        unBloqueoValido({
          canchaIds: [canchaId],
          desdeFecha: dentroDe(3),
          hastaFecha: dentroDe(3),
        }),
      )
      .expect(409);

    expect(body.datos.reservas).toEqual([
      expect.objectContaining({
        cancha: 'Cancha 1',
        titular: 'Valeria León Paredes',
      }),
    ]);
  });

  it('la base no deja guardar dos reservas que se pisan en la misma cancha', async () => {
    const inicio = `${dentroDe(4)}T18:00:00-05:00`;
    await guardarReserva(prisma, { canchaId, inicio, minutos: 120 });

    await expect(
      guardarReserva(prisma, {
        canchaId,
        inicio: `${dentroDe(4)}T19:00:00-05:00`,
      }),
    ).rejects.toThrow();
  });
});
