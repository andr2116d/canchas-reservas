export const AVISOS_DE_RESERVA = Symbol('AVISOS_DE_RESERVA');

/** Avisa al personal lo que pasa con las reservas. Si el aviso falla, la reserva sigue en pie. */
export interface AvisosDeReserva {
  /** A recepción y a administración, con el código de la reserva. */
  nuevaReserva(codigo: string): Promise<void>;
}
