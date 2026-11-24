import type {
  ConsultaDeReservas,
  ReservaAfectada,
  ReservasDeCancha,
} from '../../src/modulos/canchas/aplicacion/reservas-de-cancha.port';

/** Reservas que la prueba asigna a cada cancha. */
export class ReservasDeCanchaDePrueba implements ReservasDeCancha {
  private readonly porCancha = new Map<number, ReservaAfectada[]>();

  /** Agrega una reserva de una hora que empieza en el momento dado. */
  reservar(canchaId: number, inicio: string, titular = 'R. Castillo'): void {
    const desde = new Date(inicio);
    const fin = new Date(desde.getTime() + 60 * 60 * 1000);
    const reservas = this.porCancha.get(canchaId) ?? [];
    this.porCancha.set(canchaId, [
      ...reservas,
      { inicio: desde, fin, titular },
    ]);
  }

  porJugar(canchaId: number, desde: Date): Promise<ReservaAfectada[]> {
    return Promise.resolve(
      (this.porCancha.get(canchaId) ?? []).filter((r) => r.fin > desde),
    );
  }

  enRangos(
    consultas: ConsultaDeReservas[],
  ): Promise<(ReservaAfectada & { canchaId: number })[]> {
    return Promise.resolve(
      consultas.flatMap(({ canchaId, inicio, fin }) =>
        (this.porCancha.get(canchaId) ?? [])
          .filter((r) => r.inicio < fin && inicio < r.fin)
          .map((r) => ({ ...r, canchaId })),
      ),
    );
  }

  conReservas(canchaIds: number[]): Promise<Set<number>> {
    return Promise.resolve(
      new Set(canchaIds.filter((id) => this.porCancha.has(id))),
    );
  }
}
