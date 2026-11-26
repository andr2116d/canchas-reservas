import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';
import type { EstadoDeReserva } from '../dominio/estado-del-turno';

export const OCUPACION_DEL_DIA = Symbol('OCUPACION_DEL_DIA');

/** Una cancha operativa, con lo que el mapa de turnos necesita mostrar. */
export interface CanchaConsultada {
  id: number;
  nombre: string;
  tipo: TipoDeCancha;
  tieneIluminacion: boolean;
}

/** Un rango en que una cancha no se puede reservar. */
export interface BloqueoDelDia {
  canchaId: number;
  inicio: Date;
  fin: Date;
}

export interface ReservaDelDia extends BloqueoDelDia {
  estado: EstadoDeReserva;
}

/** Lo que se lee de canchas, reservas y bloqueos para armar el mapa de un día. */
export interface OcupacionDelDia {
  /** Las canchas operativas, en el orden en que se crearon. Las desactivadas no se muestran. */
  canchasOperativas(): Promise<CanchaConsultada[]>;

  /** Reservas que ocupan su turno y bloqueos vigentes que se cruzan con el rango. */
  entre(
    inicio: Date,
    fin: Date,
  ): Promise<{ reservas: ReservaDelDia[]; bloqueos: BloqueoDelDia[] }>;
}
