import {
  enLima,
  JUGADOR,
  prepararReservas,
  unTurnoLibre,
} from '../../../../test/reservas/fabricas/local-de-reservas';
import { TurnoNoDisponibleError } from '../dominio/turno-no-disponible.error';

const PEDIDO = { canchaId: 1, fecha: '2026-11-28', desde: '19:00' };

describe('Resumir una reserva antes de separarla', () => {
  it('muestra el turno con su precio, el adelanto, los plazos de cancelación y el material activo', async () => {
    const { resumir } = prepararReservas();

    const resumen = await resumir.ejecutar(PEDIDO, JUGADOR);

    expect(resumen).toEqual({
      cancha: {
        id: 1,
        nombre: 'Cancha 1',
        tipo: 'FUTBOL_5',
        tieneIluminacion: true,
      },
      fecha: '2026-11-28',
      desde: '19:00',
      hasta: '20:00',
      inicio: enLima('2026-11-28', '19:00'),
      precio: '80.00',
      adelanto: '40.00',
      porcentajeDeAdelanto: 50,
      minutosDeRetencion: 15,
      plazos: [
        {
          hasta: enLima('2026-11-27', '19:00'),
          porcentaje: 100,
          ofreceCredito: true,
        },
        {
          hasta: enLima('2026-11-28', '17:00'),
          porcentaje: 50,
          ofreceCredito: false,
        },
        {
          hasta: enLima('2026-11-28', '19:00'),
          porcentaje: 0,
          ofreceCredito: false,
        },
      ],
      adicionales: [
        { id: 11, nombre: 'Balón', descripcion: 'Número 5', precio: '35.00' },
        { id: 12, nombre: 'Chalecos', descripcion: null, precio: '6.00' },
      ],
    });
  });

  it('avisa si el turno ya no está libre', async () => {
    const { resumir, turnos } = prepararReservas();
    turnos.turnos[0] = unTurnoLibre({ libre: false });

    await expect(resumir.ejecutar(PEDIDO, JUGADOR)).rejects.toThrow(
      TurnoNoDisponibleError,
    );
  });
});

describe('Resumir la reserva con el plazo vigente', () => {
  it('dice los minutos que guardó administración para pagar', async () => {
    const local = prepararReservas();
    local.plazos.minutos = 45;

    const resumen = await local.resumir.ejecutar(PEDIDO, JUGADOR);

    expect(resumen.minutosDeRetencion).toBe(45);
  });
});
