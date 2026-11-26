export const RESERVAS_DE_CANCHA = Symbol('RESERVAS_DE_CANCHA');

/** Una reserva que impide desactivar o cambiar una cancha. */
export interface ReservaAfectada {
  inicio: Date;
  fin: Date;
  titular: string;
}

/** Una cancha y un rango en que se busca si hay reservas. */
export interface ConsultaDeReservas {
  canchaId: number;
  inicio: Date;
  fin: Date;
}

/** Lo que el módulo de canchas necesita saber de las reservas. */
export interface ReservasDeCancha {
  /** Reservas confirmadas de la cancha que aún no terminan en el momento dado (en juego o por empezar), la más próxima primero. */
  porJugar(canchaId: number, desde: Date): Promise<ReservaAfectada[]>;

  /** Reservas confirmadas que se cruzan con alguno de los rangos de cada cancha. */
  enRangos(
    consultas: ConsultaDeReservas[],
  ): Promise<(ReservaAfectada & { canchaId: number })[]>;

  /** De las canchas dadas, las que tuvieron alguna reserva alguna vez. */
  conReservas(canchaIds: number[]): Promise<Set<number>>;
}
