import {
  fechaEnLima,
  horaEnLima,
} from '../../../compartido/dominio/momento-en-lima';
import { retieneElTurno } from '../../../compartido/dominio/reserva-que-ocupa';
import type { EstadoDeReserva } from './reserva.repository';

/** Una pendiente de pago que ya venció se ve expirada aunque aún no se haya marcado así. */
export function estadoALaVista(
  reserva: { estado: EstadoDeReserva; venceEn: Date | null },
  ahora: Date,
): EstadoDeReserva {
  const vencida =
    reserva.estado === 'PENDIENTE_DE_PAGO' && !retieneElTurno(reserva, ahora);
  return vencida ? 'EXPIRADA' : reserva.estado;
}

/** Un turno que termina a medianoche se muestra hasta las 24:00. */
export function horaDeFin({ inicio, fin }: { inicio: Date; fin: Date }) {
  return fechaEnLima(fin) > fechaEnLima(inicio) ? '24:00' : horaEnLima(fin);
}
