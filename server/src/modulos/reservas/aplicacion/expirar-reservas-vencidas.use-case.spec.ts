import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaReservaRepository } from '../../../../test/reservas/dobles/en-memoria-reserva.repository';
import { AvisosDeReservaDePrueba } from '../../../../test/reservas/dobles/puertos-de-reserva-de-prueba';
import { unaReservaNueva } from '../../../../test/reservas/fabricas/reserva-nueva';
import type { EstadoDeReserva } from '../dominio/reserva.repository';
import { ExpirarReservasVencidasUseCase } from './expirar-reservas-vencidas.use-case';

// El reloj de prueba marca las 10:00 UTC del 22 de noviembre de 2026.
const MINUTOS = (n: number) => new Date(Date.UTC(2026, 10, 22, 10, n));

function preparar() {
  const reservas = new EnMemoriaReservaRepository();
  const avisos = new AvisosDeReservaDePrueba();
  const reloj = new RelojDePrueba();
  const expirar = new ExpirarReservasVencidasUseCase(reservas, avisos, reloj);
  const guardar = (
    codigo: string,
    venceEn: Date,
    estado: EstadoDeReserva = 'PENDIENTE_DE_PAGO',
  ) =>
    reservas.reservas.push({
      ...unaReservaNueva({ codigo, titularId: 7, venceEn }),
      estado,
    });
  return { reservas, avisos, reloj, expirar, guardar };
}

describe('ExpirarReservasVencidasUseCase', () => {
  it('pasa a expirada cada reserva por pagar que ya venció y avisa a su titular', async () => {
    const { expirar, guardar, reservas, avisos, reloj } = preparar();
    guardar('VENCID', MINUTOS(-1));

    const cantidad = await expirar.ejecutar();

    expect(cantidad).toBe(1);
    expect(reservas.reservas[0]).toMatchObject({
      estado: 'EXPIRADA',
      expiradaEn: reloj.ahora(),
    });
    expect(avisos.vencidas).toEqual([{ codigo: 'VENCID', titularId: 7 }]);
  });

  it('una reserva que vence justo ahora también expira', async () => {
    const { expirar, guardar, reservas } = preparar();
    guardar('JUSTOA', MINUTOS(0));

    await expirar.ejecutar();

    expect(reservas.reservas[0].estado).toBe('EXPIRADA');
  });

  it('no toca una reserva por pagar que todavía no vence', async () => {
    const { expirar, guardar, reservas, avisos } = preparar();
    guardar('ATIEMP', MINUTOS(1));

    expect(await expirar.ejecutar()).toBe(0);
    expect(reservas.reservas[0].estado).toBe('PENDIENTE_DE_PAGO');
    expect(avisos.vencidas).toEqual([]);
  });

  it('una reserva con el pago por validar no vence aunque pase el plazo', async () => {
    const { expirar, guardar, reservas } = preparar();
    guardar('PORVAL', MINUTOS(-30), 'PENDIENTE_DE_VALIDACION');

    await expirar.ejecutar();

    expect(reservas.reservas[0].estado).toBe('PENDIENTE_DE_VALIDACION');
  });

  it('una expirada no se vuelve a expirar ni se avisa dos veces', async () => {
    const { expirar, guardar, avisos } = preparar();
    guardar('VENCID', MINUTOS(-1));
    await expirar.ejecutar();

    expect(await expirar.ejecutar()).toBe(0);
    expect(avisos.vencidas).toHaveLength(1);
  });
});
