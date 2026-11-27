import {
  enLima,
  JUGADOR,
  prepararReservas,
  unPedido,
  unTurnoLibre,
} from '../../../../test/reservas/fabricas/local-de-reservas';
import { LimiteDePendientesError } from '../dominio/limite-de-pendientes.error';
import { MontosCambiaronError } from '../dominio/montos-cambiaron.error';
import { ReservasSinConfigurarError } from '../dominio/reservas-sin-configurar.error';
import { TitularNoHabilitadoError } from '../dominio/titular-no-habilitado.error';
import { TurnoNoDisponibleError } from '../dominio/turno-no-disponible.error';

describe('Reservar un turno', () => {
  it('separa un turno libre: queda pendiente de pago con sus montos, la regla vigente y quién la creó', async () => {
    const { reservar, reservas } = prepararReservas({ codigos: ['7K3Q9X'] });

    const separada = await reservar.ejecutar(unPedido());

    expect(separada).toMatchObject({
      codigo: '7K3Q9X',
      estado: 'PENDIENTE_DE_PAGO',
    });
    expect(reservas.reservas[0]).toMatchObject({
      canchaId: 1,
      titularId: JUGADOR,
      creadaPorId: JUGADOR,
      canal: 'WEB',
      inicio: enLima('2026-11-28', '19:00'),
      fin: enLima('2026-11-28', '20:00'),
      porcentajeDeAdelanto: 50,
      reglaDeCancelacionId: 3,
    });
    expect(reservas.reservas[0].precio.enSoles()).toBe('80.00');
    expect(reservas.reservas[0].adelanto.enSoles()).toBe('40.00');
  });

  it('avisa a recepción y a administración de la reserva nueva', async () => {
    const { reservar, avisos } = prepararReservas({ codigos: ['7K3Q9X'] });

    await reservar.ejecutar(unPedido());

    expect(avisos.nuevas).toEqual(['7K3Q9X']);
  });

  it('retiene el turno 15 minutos, o hasta su inicio si empieza antes', async () => {
    const temprano = prepararReservas();
    const justo = prepararReservas({ ahora: enLima('2026-11-28', '18:50') });

    const conTiempo = await temprano.reservar.ejecutar(unPedido());
    const alLimite = await justo.reservar.ejecutar(unPedido());

    expect(conTiempo.venceEn).toEqual(enLima('2026-11-27', '10:15'));
    expect(alLimite.venceEn).toEqual(enLima('2026-11-28', '19:00'));
  });

  it('no separa un turno que no está libre o que no existe', async () => {
    const { reservar, turnos } = prepararReservas();
    turnos.turnos[0] = unTurnoLibre({ libre: false });

    await expect(reservar.ejecutar(unPedido())).rejects.toThrow(
      TurnoNoDisponibleError,
    );
    await expect(
      reservar.ejecutar(unPedido({ desde: '21:00' })),
    ).rejects.toThrow(TurnoNoDisponibleError);
  });

  it('no separa si el precio o el adelanto cambiaron y devuelve los montos nuevos', async () => {
    const { reservar, turnos, reservas } = prepararReservas();
    turnos.turnos[0] = unTurnoLibre({
      precio: '90.00',
      adelanto: { monto: '45.00', porcentaje: 50 },
    });

    const error = await reservar.ejecutar(unPedido()).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MontosCambiaronError);
    expect((error as MontosCambiaronError).datos).toEqual({
      precio: '90.00',
      adelanto: '45.00',
    });
    expect(reservas.reservas).toHaveLength(0);
  });

  it('no separa mientras falte definir el adelanto o la regla de cancelación', async () => {
    const sinAdelanto = prepararReservas();
    sinAdelanto.turnos.turnos[0] = unTurnoLibre({ adelanto: null });
    const sinRegla = prepararReservas();
    sinRegla.reglas.versiones.length = 0;

    await expect(sinAdelanto.reservar.ejecutar(unPedido())).rejects.toThrow(
      ReservasSinConfigurarError,
    );
    await expect(sinRegla.reservar.ejecutar(unPedido())).rejects.toThrow(
      ReservasSinConfigurarError,
    );
  });

  it('guarda el material pedido, solo si está activo', async () => {
    const { reservar, reservas } = prepararReservas();

    await reservar.ejecutar(unPedido({ adicionales: [12, 11, 12] }));
    const conInactivo = reservar.ejecutar(
      unPedido({ desde: '19:00', adicionales: [99] }),
    );

    expect(reservas.reservas[0].adicionalIds).toEqual([11, 12]);
    await expect(conInactivo).rejects.toThrow(
      'Uno de los materiales ya no está disponible.',
    );
  });

  it('no deja tener más de 2 reservas pendientes de pago a la vez', async () => {
    const { reservar, turnos } = prepararReservas();
    turnos.turnos.push(
      unTurnoLibre({
        desde: '20:00',
        hasta: '21:00',
        inicio: enLima('2026-11-28', '20:00'),
        fin: enLima('2026-11-28', '21:00'),
      }),
      unTurnoLibre({
        desde: '21:00',
        hasta: '22:00',
        inicio: enLima('2026-11-28', '21:00'),
        fin: enLima('2026-11-28', '22:00'),
      }),
    );

    await reservar.ejecutar(unPedido());
    await reservar.ejecutar(unPedido({ desde: '20:00' }));

    await expect(
      reservar.ejecutar(unPedido({ desde: '21:00' })),
    ).rejects.toThrow(LimiteDePendientesError);
  });

  it('solo reserva una cuenta de jugador activa de una persona con 18 años cumplidos', async () => {
    const { reservar, titulares } = prepararReservas();
    titulares.cuentas.set(8, {
      esJugadorActivo: true,
      fechaNacimiento: '2010-01-01',
    });
    titulares.cuentas.set(9, {
      esJugadorActivo: false,
      fechaNacimiento: '1990-01-01',
    });

    for (const titularId of [8, 9, 10]) {
      await expect(reservar.ejecutar(unPedido({ titularId }))).rejects.toThrow(
        TitularNoHabilitadoError,
      );
    }
  });

  it('si el código elegido ya existe, separa con otro', async () => {
    const { reservar, reservas } = prepararReservas({
      codigos: ['AAAAAA', 'AAAAAA', 'BBBBBB'],
    });
    await reservar.ejecutar(unPedido({ desde: '19:00' }));
    reservas.reservas[0].estado = 'EXPIRADA';

    const segunda = await reservar.ejecutar(unPedido());

    expect(segunda.codigo).toBe('BBBBBB');
  });
});
