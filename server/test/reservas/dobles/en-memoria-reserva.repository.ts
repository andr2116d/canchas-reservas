import {
  ocupaElTurno,
  retieneElTurno,
} from '../../../src/compartido/dominio/reserva-que-ocupa';
import { CodigoRepetidoError } from '../../../src/modulos/reservas/dominio/codigo-repetido.error';
import { LimiteDePendientesError } from '../../../src/modulos/reservas/dominio/limite-de-pendientes.error';
import type {
  EstadoDeReserva,
  ReservaGuardada,
  ReservaNueva,
  ReservaRepository,
} from '../../../src/modulos/reservas/dominio/reserva.repository';
import { TurnoNoDisponibleError } from '../../../src/modulos/reservas/dominio/turno-no-disponible.error';

type ReservaEnMemoria = ReservaNueva & { estado: EstadoDeReserva };

/** Reservas en memoria con las mismas reglas que la base: sin cruces y con máximo de pendientes. */
export class EnMemoriaReservaRepository implements ReservaRepository {
  readonly reservas: ReservaEnMemoria[] = [];

  crear(reserva: ReservaNueva, maximoDePendientes: number): Promise<void> {
    const vigentes = this.reservas.filter(
      (otra) =>
        ocupaElTurno(otra.estado) &&
        retieneElTurno(
          {
            venceEn: otra.estado === 'PENDIENTE_DE_PAGO' ? otra.venceEn : null,
          },
          reserva.creadaEn,
        ),
    );
    if (this.reservas.some((otra) => otra.codigo === reserva.codigo))
      return Promise.reject(new CodigoRepetidoError());
    const pendientes = vigentes.filter(
      (otra) =>
        otra.titularId === reserva.titularId &&
        otra.estado === 'PENDIENTE_DE_PAGO',
    );
    if (!reserva.cobro && pendientes.length >= maximoDePendientes)
      return Promise.reject(new LimiteDePendientesError(maximoDePendientes));
    const cruza = vigentes.some(
      (otra) =>
        otra.canchaId === reserva.canchaId &&
        otra.inicio < reserva.fin &&
        reserva.inicio < otra.fin,
    );
    if (cruza) return Promise.reject(new TurnoNoDisponibleError());
    this.reservas.push({
      ...reserva,
      estado: reserva.cobro ? 'CONFIRMADA' : 'PENDIENTE_DE_PAGO',
    });
    return Promise.resolve();
  }

  delTitular(
    titularId: number,
    codigo: string,
  ): Promise<ReservaGuardada | undefined> {
    const reserva = this.reservas.find(
      (r) => r.codigo === codigo && r.titularId === titularId,
    );
    if (!reserva) return Promise.resolve(undefined);
    return Promise.resolve({
      ...reserva,
      cancha: { nombre: 'Cancha 1', tipo: 'FUTBOL_5', tieneIluminacion: true },
      rangos: [{ desdeHoras: 0, porcentaje: 100, ofreceCredito: false }],
      adicionales: [],
    });
  }
}
