import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Una reserva por jugar que el horario nuevo ya no atiende, lista para avisar a su cliente. */
export interface ReservaFueraDeHorario {
  codigo: string;
  cancha: string;
  fecha: string;
  desde: string;
  hasta: string;
  estado: string;
  titular: string;
  celular: string | null;
}

/** El horario nuevo deja reservas fuera: no se guarda hasta que administración lo confirme. */
export class ReservasFueraDeHorarioError extends ConflictoError {
  constructor(reservasFueraDeHorario: ReservaFueraDeHorario[]) {
    super(
      'Hay reservas que quedan fuera del nuevo horario. No se anulan: avisa a cada cliente y confirma para guardar igual.',
      {},
      { reservasFueraDeHorario },
    );
  }
}
