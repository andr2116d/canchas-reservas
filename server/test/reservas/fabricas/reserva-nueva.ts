import { Monto } from '../../../src/compartido/dominio/monto.value-object';
import type { ReservaNueva } from '../../../src/modulos/reservas/dominio/reserva.repository';

/** Una reserva web de S/ 80 con S/ 40 de adelanto, el 22 de noviembre de 19:00 a 20:00 en Lima. */
export function unaReservaNueva(
  cambios: Partial<ReservaNueva> = {},
): ReservaNueva {
  return {
    codigo: 'ABCDEF',
    canchaId: 1,
    titularId: 7,
    creadaPorId: 7,
    inicio: new Date('2026-11-23T00:00:00.000Z'),
    fin: new Date('2026-11-23T01:00:00.000Z'),
    precio: Monto.crear('80'),
    porcentajeDeAdelanto: 50,
    adelanto: Monto.crear('40'),
    reglaDeCancelacionId: 3,
    canal: 'WEB',
    creadaEn: new Date('2026-11-22T09:45:00.000Z'),
    venceEn: new Date('2026-11-22T10:00:00.000Z'),
    adicionalIds: [],
    ...cambios,
  };
}
