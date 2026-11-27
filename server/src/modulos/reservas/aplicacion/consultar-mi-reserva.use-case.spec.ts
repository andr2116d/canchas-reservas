import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  enLima,
  JUGADOR,
  prepararReservas,
  unPedido,
} from '../../../../test/reservas/fabricas/local-de-reservas';
import { ReservaNoEncontradaError } from '../dominio/reserva-no-encontrada.error';
import { ConsultarMiReservaUseCase } from './consultar-mi-reserva.use-case';

async function conUnaReservaSeparada() {
  const local = prepararReservas({ codigos: ['7K3Q9X'] });
  await local.reservar.ejecutar(unPedido());
  const reloj = new RelojDePrueba(enLima('2026-11-27', '10:05'));
  const consultar = new ConsultarMiReservaUseCase(local.reservas, reloj);
  return { consultar, reloj };
}

describe('Consultar la reserva propia', () => {
  it('muestra el turno, los montos, cuándo vence y la hora del server para medir lo que falta', async () => {
    const { consultar } = await conUnaReservaSeparada();

    const reserva = await consultar.ejecutar(JUGADOR, '7K3Q9X');

    expect(reserva).toMatchObject({
      codigo: '7K3Q9X',
      estado: 'PENDIENTE_DE_PAGO',
      cancha: { nombre: 'Cancha 1', tipo: 'FUTBOL_5', tieneIluminacion: true },
      fecha: '2026-11-28',
      desde: '19:00',
      hasta: '20:00',
      precio: '80.00',
      adelanto: '40.00',
      porcentajeDeAdelanto: 50,
      venceEn: enLima('2026-11-27', '10:15'),
      ahora: enLima('2026-11-27', '10:05'),
      plazos: [{ hasta: enLima('2026-11-28', '19:00'), porcentaje: 100 }],
    });
  });

  it('una pendiente de pago que ya venció se muestra expirada', async () => {
    const { consultar, reloj } = await conUnaReservaSeparada();
    reloj.avanzarMinutos(10);

    const reserva = await consultar.ejecutar(JUGADOR, '7K3Q9X');

    expect(reserva.estado).toBe('EXPIRADA');
  });

  it('una reserva ajena o inexistente responde como si no existiera', async () => {
    const { consultar } = await conUnaReservaSeparada();

    await expect(consultar.ejecutar(99, '7K3Q9X')).rejects.toThrow(
      ReservaNoEncontradaError,
    );
    await expect(consultar.ejecutar(JUGADOR, 'ZZZZZZ')).rejects.toThrow(
      ReservaNoEncontradaError,
    );
  });
});
