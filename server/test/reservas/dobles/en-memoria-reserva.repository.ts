import { ocupaElTurno } from '../../../src/compartido/dominio/reserva-que-ocupa';
import { CodigoRepetidoError } from '../../../src/modulos/reservas/dominio/codigo-repetido.error';
import { LimiteDePendientesError } from '../../../src/modulos/reservas/dominio/limite-de-pendientes.error';
import type {
  EstadoDeReserva,
  ReservaExpirada,
  ReservaGuardada,
  ReservaNueva,
  ReservaRepository,
} from '../../../src/modulos/reservas/dominio/reserva.repository';
import { TurnoNoDisponibleError } from '../../../src/modulos/reservas/dominio/turno-no-disponible.error';

type ReservaEnMemoria = ReservaNueva & {
  estado: EstadoDeReserva;
  expiradaEn?: Date;
};

const vencida = (reserva: ReservaEnMemoria, ahora: Date) =>
  reserva.estado === 'PENDIENTE_DE_PAGO' && reserva.venceEn <= ahora;

const cruzan = (a: ReservaNueva, b: ReservaNueva) =>
  a.canchaId === b.canchaId && a.inicio < b.fin && b.inicio < a.fin;

/** Reservas en memoria con las mismas reglas que la base: sin cruces y con máximo de pendientes. */
export class EnMemoriaReservaRepository implements ReservaRepository {
  readonly reservas: ReservaEnMemoria[] = [];

  crear(
    reserva: ReservaNueva,
    maximoDePendientes: number,
  ): Promise<ReservaExpirada[]> {
    if (this.reservas.some((otra) => otra.codigo === reserva.codigo))
      return Promise.reject(new CodigoRepetidoError());
    // Como la base: expira las vencidas del titular y las que chocan con el turno.
    const expiradas = this.expirar(
      (otra) =>
        vencida(otra, reserva.creadaEn) &&
        (otra.titularId === reserva.titularId || cruzan(otra, reserva)),
      reserva.creadaEn,
    );
    const vigentes = this.reservas.filter((otra) => ocupaElTurno(otra.estado));
    const pendientes = vigentes.filter(
      (otra) =>
        otra.titularId === reserva.titularId &&
        otra.estado === 'PENDIENTE_DE_PAGO',
    );
    if (!reserva.cobro && pendientes.length >= maximoDePendientes)
      return Promise.reject(new LimiteDePendientesError(maximoDePendientes));
    if (vigentes.some((otra) => cruzan(otra, reserva)))
      return Promise.reject(new TurnoNoDisponibleError());
    this.reservas.push({ ...reserva, estado: reserva.cobro ? 'CONFIRMADA' : 'PENDIENTE_DE_PAGO' });
    return Promise.resolve(expiradas);
  }

  expirarVencidas(ahora: Date): Promise<ReservaExpirada[]> {
    return Promise.resolve(
      this.expirar((reserva) => vencida(reserva, ahora), ahora),
    );
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

  private expirar(
    debeExpirar: (reserva: ReservaEnMemoria) => boolean,
    ahora: Date,
  ): ReservaExpirada[] {
    return this.reservas.filter(debeExpirar).map((reserva) => {
      reserva.estado = 'EXPIRADA';
      reserva.expiradaEn = ahora;
      return { codigo: reserva.codigo, titularId: reserva.titularId };
    });
  }
}
