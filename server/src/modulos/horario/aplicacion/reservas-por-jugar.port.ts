export const RESERVAS_POR_JUGAR = Symbol('RESERVAS_POR_JUGAR');

/** Una reserva que todavía no empieza y ocupa su turno, con quién avisar si cambia el horario. */
export interface ReservaPorJugar {
  codigo: string;
  cancha: string;
  inicio: Date;
  fin: Date;
  estado: string;
  titular: { nombre: string; celular: string | null };
}

/** Las reservas que todavía se van a jugar. */
export interface ReservasPorJugar {
  /** Las que empiezan después de `ahora` y siguen ocupando su turno. */
  desde(ahora: Date): Promise<ReservaPorJugar[]>;
}
