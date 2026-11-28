import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  dentroDe,
  MANANA,
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../fabricas/local-listo';

describe('Reservar un turno desde el mapa', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let jugador: string;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let cancha: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    cancha = local.canchas[0].id;
    jugador = await unJugadorMas(app, 1);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const separar = (cuerpo: object, cookie = jugador) =>
    api().post('/api/reservas').set('Cookie', cookie).send(cuerpo);
  const estadoEnElMapa = async (canchaId: number, desde: string) => {
    const { body } = await api()
      .get('/api/disponibilidad')
      .query({ fecha: MANANA() })
      .expect(200);
    const turno = (
      body.tipos[0].turnos as {
        desde: string;
        canchas: { canchaId: number; estado: string }[];
      }[]
    ).find((t) => t.desde === desde);
    return turno?.canchas.find((c) => c.canchaId === canchaId)?.estado;
  };

  it('el resumen trae el turno, los montos, los plazos de cancelación y el material activo', async () => {
    const { body } = await api()
      .get('/api/reservas/resumen')
      .query({ canchaId: String(cancha), fecha: dentroDe(3), desde: '19:00' })
      .set('Cookie', jugador)
      .expect(200);

    expect(body).toMatchObject({
      cancha: { id: cancha, nombre: 'Cancha 1', tipo: 'FUTBOL_5' },
      desde: '19:00',
      hasta: '20:00',
      precio: '80.00',
      adelanto: '40.00',
      porcentajeDeAdelanto: 50,
      minutosDeRetencion: 15,
      adicionales: [{ nombre: 'Balón', precio: '35.00' }],
    });
    expect(
      body.plazos.map((p: { porcentaje: number }) => p.porcentaje),
    ).toEqual([100, 0]);
  });

  it('separa el turno: queda pendiente de pago con sus montos, su regla y el material pedido', async () => {
    const { body } = await separar(
      separarALas19(cancha, { adicionales: [local.balonId] }),
    ).expect(201);

    expect(body).toMatchObject({ estado: 'PENDIENTE_DE_PAGO' });
    expect(body.codigo).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    const guardada = await prisma.reserva.findUniqueOrThrow({
      where: { codigo: body.codigo },
      include: { adicionalesPedidos: true },
    });
    expect(guardada).toMatchObject({
      canal: 'WEB',
      porcentajeDeAdelanto: 50,
      adicionalesPedidos: [
        expect.objectContaining({ adicionalId: local.balonId }),
      ],
    });
    expect(guardada.precio.toFixed(2)).toBe('80.00');
    expect(guardada.adelanto.toFixed(2)).toBe('40.00');
    expect(guardada.creadaPorId).toBe(guardada.titularId);
    expect(await estadoEnElMapa(cancha, '19:00')).toBe('PENDIENTE');
  });

  it('el plazo para pagar que guarda administración rige solo para las reservas nuevas', async () => {
    const { body: anterior } = await separar(separarALas19(cancha)).expect(201);
    await local.guardar('put', '/api/plazo-de-pago', { minutos: '45' });

    const resumen = await api()
      .get('/api/reservas/resumen')
      .query({ canchaId: String(cancha), fecha: MANANA(), desde: '20:00' })
      .set('Cookie', jugador)
      .expect(200);
    const { body: nueva } = await separar(
      separarALas19(cancha, { desde: '20:00' }),
    ).expect(201);

    const minutos = (reserva: { venceEn: string }, desde: number) =>
      (new Date(reserva.venceEn).getTime() - desde) / 60_000;
    const creadas = await prisma.reserva.findMany({
      orderBy: { id: 'asc' },
      select: { creadoEn: true },
    });
    expect(resumen.body.minutosDeRetencion).toBe(45);
    expect(minutos(anterior, creadas[0].creadoEn.getTime())).toBe(15);
    expect(minutos(nueva, creadas[1].creadoEn.getTime())).toBe(45);
  });

  it('el titular ve su reserva con cuánto falta para que venza', async () => {
    const { body: separada } = await separar(separarALas19(cancha)).expect(201);

    const { body } = await api()
      .get(`/api/reservas/${separada.codigo}`)
      .set('Cookie', jugador)
      .expect(200);

    expect(body).toMatchObject({
      codigo: separada.codigo,
      estado: 'PENDIENTE_DE_PAGO',
      fecha: MANANA(),
      desde: '19:00',
      hasta: '20:00',
      precio: '80.00',
      venceEn: separada.venceEn,
    });
    expect(
      new Date(body.venceEn).getTime() - new Date(body.ahora).getTime(),
    ).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it('administración recibe el aviso «Nueva reserva» con el código', async () => {
    const { body } = await separar(separarALas19(cancha)).expect(201);

    const { body: avisos } = await api()
      .get('/api/avisos')
      .set('Cookie', local.administrador)
      .expect(200);

    expect(avisos.avisos).toEqual([
      expect.objectContaining({
        tipo: 'NUEVA_RESERVA',
        referencia: body.codigo,
      }),
    ]);
  });

  it('la reserva entra al historial de cambios como importante, con quién la separó', async () => {
    const { body } = await separar(separarALas19(cancha)).expect(201);

    const { body: pagina } = await api()
      .get('/api/historial')
      .query({ categoria: 'RESERVAS' })
      .set('Cookie', local.administrador)
      .expect(200);

    expect(pagina.registros).toEqual([
      expect.objectContaining({
        accion: 'SEPARACION',
        importante: true,
        sujeto: `Reserva ${body.codigo}`,
        autor: expect.objectContaining({ nombre: 'Valeria León Paredes' }),
      }),
    ]);
  });

  it('un turno ya separado no se vuelve a separar', async () => {
    const otro = await unJugadorMas(app, 2);
    await separar(separarALas19(cancha)).expect(201);

    const { body } = await separar(separarALas19(cancha), otro).expect(409);

    expect(body.mensaje).toBe('Este turno ya no está libre. Elige otro.');
  });

  it('si el precio cambió, no separa y devuelve los montos nuevos', async () => {
    await local.guardar('put', '/api/tarifas/FUTBOL_5', {
      precioDia: '60',
      precioNoche: '90',
      duracionDelTurno: '1',
      ofreceTurnoCorto: false,
    });

    const { body } = await separar(separarALas19(cancha)).expect(409);

    expect(body.datos).toEqual({ precio: '90.00', adelanto: '45.00' });
    expect(await prisma.reserva.count()).toBe(0);
  });

  it('al vencer sin pago el turno queda libre, y quien lo separa expira la anterior', async () => {
    const { body: vieja } = await separar(separarALas19(cancha)).expect(201);
    await prisma.reserva.update({
      where: { codigo: vieja.codigo },
      data: { venceEn: new Date(Date.now() - 1000) },
    });

    expect(await estadoEnElMapa(cancha, '19:00')).toBe('DISPONIBLE');
    await separar(separarALas19(cancha), await unJugadorMas(app, 2)).expect(
      201,
    );

    const anterior = await prisma.reserva.findUniqueOrThrow({
      where: { codigo: vieja.codigo },
    });
    expect(anterior.estado).toBe('EXPIRADA');
  });

  it('no deja tener más de 2 reservas pendientes de pago a la vez', async () => {
    await separar(separarALas19(cancha, { desde: '19:00' })).expect(201);
    await separar(separarALas19(cancha, { desde: '20:00' })).expect(201);

    const { body } = await separar(
      separarALas19(cancha, { desde: '21:00' }),
    ).expect(409);

    expect(body.mensaje).toContain('Ya hay 2 reservas esperando pago.');
  });

  it('mientras falte la regla de cancelación no se puede reservar', async () => {
    await prisma.reglaDeCancelacion.deleteMany();

    const { body } = await separar(separarALas19(cancha)).expect(409);

    expect(body.mensaje).toContain('falta que administración defina');
  });
});
