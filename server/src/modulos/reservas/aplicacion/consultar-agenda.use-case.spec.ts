import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  AgendaDelLocalDePrueba,
  CANCHA_2,
  PagosDePrueba,
  unaReservaDeLaAgenda,
} from '../../../../test/reservas/dobles/agenda-del-local-de-prueba';
import type { ReservaDeLaAgenda } from './agenda-del-local.port';
import { ConsultarAgendaUseCase } from './consultar-agenda.use-case';

// El reloj de prueba marca el 22 de noviembre de 2026 a las 05:00 de Lima.
const A_LAS = (hora: string, fecha = '2026-11-22') =>
  new Date(`${fecha}T${hora}:00.000-05:00`);

function crearAgenda(
  reservas: ReservaDeLaAgenda[] = [],
  pagos = new Map<number, Monto>(),
) {
  const local = new AgendaDelLocalDePrueba(reservas);
  const reloj = new RelojDePrueba();
  const agenda = new ConsultarAgendaUseCase(
    local,
    new PagosDePrueba(pagos),
    reloj,
  );
  return { agenda, local, reloj };
}

describe('ConsultarAgendaUseCase', () => {
  it('sin fecha muestra los turnos de hoy en Lima, ordenados por hora de inicio', async () => {
    const tarde = unaReservaDeLaAgenda({
      inicio: A_LAS('20:00'),
      fin: A_LAS('21:00'),
    });
    const temprano = unaReservaDeLaAgenda({
      inicio: A_LAS('16:00'),
      fin: A_LAS('17:00'),
      cancha: CANCHA_2,
    });
    const { agenda, local } = crearAgenda([tarde, temprano]);

    const resultado = await agenda.ejecutar({});

    expect(resultado.fecha).toBe('2026-11-22');
    expect(local.pedidos[0]).toEqual({
      desde: A_LAS('00:00'),
      hasta: A_LAS('00:00', '2026-11-23'),
    });
    expect(resultado.turnos.map((t) => t.desde)).toEqual(['16:00', '20:00']);
  });

  it('a la misma hora ordena por cancha', async () => {
    const enLaDos = unaReservaDeLaAgenda({ cancha: CANCHA_2 });
    const enLaUno = unaReservaDeLaAgenda();
    const { agenda } = crearAgenda([enLaDos, enLaUno]);

    const { turnos } = await agenda.ejecutar({});

    expect(turnos.map((t) => t.cancha.nombre)).toEqual([
      'Cancha 1',
      'Cancha 2',
    ]);
  });

  it('cada turno trae su horario, cancha, cliente, celular, estado, lo pagado y el saldo', async () => {
    const reserva = unaReservaDeLaAgenda();
    const { agenda } = crearAgenda(
      [reserva],
      new Map([[reserva.id, Monto.crear('40')]]),
    );

    const { turnos } = await agenda.ejecutar({});

    expect(turnos[0]).toMatchObject({
      codigo: reserva.codigo,
      desde: '19:00',
      hasta: '20:00',
      cancha: { id: 1, nombre: 'Cancha 1', tipo: 'FUTBOL_5' },
      cliente: { nombre: 'Lucía Ramos Vega', celular: '987654321' },
      estado: 'CONFIRMADA',
      precio: '80.00',
      adelanto: '40.00',
      pagado: '40.00',
      saldo: '40.00',
      pagada: false,
    });
  });

  it('una reserva sin pagos registrados tiene todo el precio por cobrar', async () => {
    const { agenda } = crearAgenda([unaReservaDeLaAgenda()]);

    const { turnos } = await agenda.ejecutar({});

    expect(turnos[0]).toMatchObject({ pagado: '0.00', saldo: '80.00' });
  });

  it('distingue la confirmada totalmente pagada de la que aún tiene saldo', async () => {
    const pagada = unaReservaDeLaAgenda();
    const conSaldo = unaReservaDeLaAgenda({ cancha: CANCHA_2 });
    const { agenda } = crearAgenda(
      [pagada, conSaldo],
      new Map([
        [pagada.id, Monto.crear('80')],
        [conSaldo.id, Monto.crear('40')],
      ]),
    );

    const { turnos } = await agenda.ejecutar({});

    expect(turnos.map((t) => [t.saldo, t.pagada])).toEqual([
      ['0.00', true],
      ['40.00', false],
    ]);
  });

  it('un turno que termina a medianoche se muestra hasta las 24:00', async () => {
    const { agenda } = crearAgenda([
      unaReservaDeLaAgenda({
        inicio: A_LAS('23:00'),
        fin: A_LAS('00:00', '2026-11-23'),
      }),
    ]);

    const { turnos } = await agenda.ejecutar({});

    expect(turnos[0].hasta).toBe('24:00');
  });

  it('consulta la agenda de otra fecha, también de días pasados', async () => {
    const { agenda, local } = crearAgenda();

    const resultado = await agenda.ejecutar({ fecha: '2026-10-01' });

    expect(resultado.fecha).toBe('2026-10-01');
    expect(local.pedidos[0].desde).toEqual(A_LAS('00:00', '2026-10-01'));
  });

  it('no consulta más allá de los 30 días en que se puede reservar', async () => {
    const { agenda } = crearAgenda();

    await expect(agenda.ejecutar({ fecha: '2026-12-23' })).rejects.toThrow(
      ReglaInvalidaError,
    );
    await expect(
      agenda.ejecutar({ fecha: '2026-12-22' }),
    ).resolves.toBeDefined();
  });

  it('rechaza una fecha que no existe', async () => {
    const { agenda } = crearAgenda();

    await expect(agenda.ejecutar({ fecha: '2026-02-30' })).rejects.toThrow(
      ReglaInvalidaError,
    );
  });

  it('filtra por cancha y por estado', async () => {
    const confirmada = unaReservaDeLaAgenda();
    const enLaDos = unaReservaDeLaAgenda({ cancha: CANCHA_2 });
    const enJuego = unaReservaDeLaAgenda({
      estado: 'EN_JUEGO',
      inicio: A_LAS('17:00'),
    });
    const { agenda } = crearAgenda([confirmada, enLaDos, enJuego]);

    const porCancha = await agenda.ejecutar({ canchaId: '1' });
    const porAmbos = await agenda.ejecutar({
      canchaId: '1',
      estado: 'CONFIRMADA',
    });

    expect(porCancha.turnos.map((t) => t.codigo)).toEqual([
      enJuego.codigo,
      confirmada.codigo,
    ]);
    expect(porAmbos.turnos.map((t) => t.codigo)).toEqual([confirmada.codigo]);
  });

  it('cuenta los turnos de cada estado de la cancha elegida, sin aplicar el filtro de estado', async () => {
    const { agenda } = crearAgenda([
      unaReservaDeLaAgenda(),
      unaReservaDeLaAgenda({ estado: 'EN_JUEGO', inicio: A_LAS('17:00') }),
      unaReservaDeLaAgenda({ cancha: CANCHA_2 }),
    ]);

    const { conteos } = await agenda.ejecutar({
      canchaId: '1',
      estado: 'EN_JUEGO',
    });

    expect(conteos).toEqual({
      PENDIENTE_DE_PAGO: 0,
      PENDIENTE_DE_VALIDACION: 0,
      CONFIRMADA: 1,
      EN_JUEGO: 1,
      EXPIRADA: 0,
    });
  });

  it('lista las canchas para el filtro', async () => {
    const { agenda } = crearAgenda();

    const { canchas } = await agenda.ejecutar({});

    expect(canchas.map((c) => c.nombre)).toEqual(['Cancha 1', 'Cancha 2']);
  });

  it.each([['0'], ['99'], ['abc'], ['99999999999']])(
    'rechaza la cancha %s, que no está en la lista',
    async (canchaId) => {
      const { agenda } = crearAgenda();

      await expect(agenda.ejecutar({ canchaId })).rejects.toThrow(
        ReglaInvalidaError,
      );
    },
  );

  it('rechaza un estado que no existe', async () => {
    const { agenda } = crearAgenda();

    await expect(agenda.ejecutar({ estado: 'CANCELADA' })).rejects.toThrow(
      ReglaInvalidaError,
    );
  });

  it('cada turno trae solo las acciones que su estado permite', async () => {
    const confirmada = unaReservaDeLaAgenda();
    const expirada = unaReservaDeLaAgenda({
      estado: 'EXPIRADA',
      cancha: CANCHA_2,
    });
    const { agenda } = crearAgenda([confirmada, expirada]);

    const { turnos } = await agenda.ejecutar({});

    expect(turnos.map((t) => t.acciones)).toEqual([
      ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
      [],
    ]);
  });

  it('una pendiente de pago que ya venció se ve expirada y sin acciones', async () => {
    const vencida = unaReservaDeLaAgenda({
      estado: 'PENDIENTE_DE_PAGO',
      venceEn: A_LAS('04:59'),
    });
    const { agenda } = crearAgenda([vencida]);

    const { turnos, conteos } = await agenda.ejecutar({});

    expect(turnos[0]).toMatchObject({ estado: 'EXPIRADA', acciones: [] });
    expect(conteos.EXPIRADA).toBe(1);
  });

  it('una pendiente de pago vigente dice hasta cuándo retiene el turno', async () => {
    const vence = A_LAS('05:10');
    const { agenda } = crearAgenda([
      unaReservaDeLaAgenda({ estado: 'PENDIENTE_DE_PAGO', venceEn: vence }),
    ]);

    const { turnos } = await agenda.ejecutar({});

    expect(turnos[0]).toMatchObject({
      estado: 'PENDIENTE_DE_PAGO',
      venceEn: vence,
    });
  });

  it('avisa el próximo vencimiento, para volver a consultar cuando cambie solo', async () => {
    const { agenda, reloj } = crearAgenda([
      unaReservaDeLaAgenda({
        estado: 'PENDIENTE_DE_PAGO',
        venceEn: A_LAS('05:12'),
      }),
      unaReservaDeLaAgenda({
        estado: 'PENDIENTE_DE_PAGO',
        venceEn: A_LAS('05:08'),
        cancha: CANCHA_2,
      }),
    ]);

    const resultado = await agenda.ejecutar({});

    expect(resultado.ahora).toEqual(reloj.ahora());
    expect(resultado.proximoCambio).toEqual(A_LAS('05:08'));
  });

  it('sin pendientes por vencer no hay próximo cambio', async () => {
    const { agenda } = crearAgenda([unaReservaDeLaAgenda()]);

    const { proximoCambio } = await agenda.ejecutar({});

    expect(proximoCambio).toBeNull();
  });
});
