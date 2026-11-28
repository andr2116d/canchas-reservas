import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { AdicionalUsadoError } from '../../../src/modulos/adicionales/dominio/adicional-usado.error';
import {
  ADICIONAL_REPOSITORY,
  type AdicionalRepository,
} from '../../../src/modulos/adicionales/dominio/adicional.repository';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../../reservas/fabricas/local-listo';

describe('Un adicional pedido en reservas', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let codigo: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    const jugador = await unJugadorMas(app, 1);
    ({
      body: { codigo },
    } = await api()
      .post('/api/reservas')
      .set('Cookie', jugador)
      .send(
        separarALas19(local.canchas[0].id, { adicionales: [local.balonId] }),
      )
      .expect(201));
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const pedidosDeLaReserva = () =>
    prisma.adicionalPedido.count({ where: { reserva: { codigo } } });

  it('no se elimina: se pide desactivarlo y la reserva conserva su material', async () => {
    const { body } = await api()
      .delete(`/api/adicionales/${local.balonId}`)
      .set('Cookie', local.administrador)
      .expect(409);

    expect(body.mensaje).toBe(
      'El adicional ya se usó en reservas. Desactívalo en lugar de eliminarlo.',
    );
    expect(await pedidosDeLaReserva()).toBe(1);
    expect(await prisma.adicional.count()).toBe(1);
  });

  it('la lista ya no ofrece eliminarlo', async () => {
    const { body } = await api()
      .get('/api/adicionales')
      .set('Cookie', local.administrador)
      .expect(200);

    expect(body).toEqual([
      expect.objectContaining({ id: local.balonId, sePuedeEliminar: false }),
    ]);
  });

  it('desactivarlo no toca lo que ya pidió la reserva', async () => {
    await api()
      .post(`/api/adicionales/${local.balonId}/desactivacion`)
      .set('Cookie', local.administrador)
      .expect(204);

    expect(await pedidosDeLaReserva()).toBe(1);
  });

  it('si la reserva lo pidió justo después de comprobarlo, tampoco se borra y se pide desactivarlo', async () => {
    const repositorio = app.get<AdicionalRepository>(ADICIONAL_REPOSITORY);
    const balon = await repositorio.buscar(local.balonId);

    await expect(
      repositorio.eliminar(balon!, {
        ejecutadoPorId: 1,
        ocurridoEn: new Date(),
      }),
    ).rejects.toThrow(AdicionalUsadoError);

    expect(await pedidosDeLaReserva()).toBe(1);
  });

  it('la base tampoco deja borrar un adicional que una reserva pidió', async () => {
    await expect(
      prisma.adicional.delete({ where: { id: local.balonId } }),
    ).rejects.toThrow();

    expect(await pedidosDeLaReserva()).toBe(1);
  });
});
