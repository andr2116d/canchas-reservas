import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';

export const TURNOS_DEL_LOCAL = Symbol('TURNOS_DEL_LOCAL');

/** El turno que se quiere separar, como se eligió en el mapa. */
export interface TurnoPedido {
  canchaId: number;
  fecha: string;
  desde: string;
}

/** Un turno del mapa con su precio y su adelanto vigentes, y si se puede elegir ahora. */
export interface TurnoDelLocal {
  cancha: {
    id: number;
    nombre: string;
    tipo: TipoDeCancha;
    tieneIluminacion: boolean;
  };
  fecha: string;
  desde: string;
  hasta: string;
  inicio: Date;
  fin: Date;
  precio: string;
  /** Falta mientras administración no defina el adelanto mínimo. */
  adelanto: { monto: string; porcentaje: number } | null;
  libre: boolean;
}

/** Lo que las reservas leen del mapa de turnos: las mismas reglas que ve el jugador. */
export interface TurnosDelLocal {
  /** Nada si la fecha no tiene ese turno en esa cancha. Lanza si la fecha no se puede consultar. */
  buscar(pedido: TurnoPedido): Promise<TurnoDelLocal | undefined>;
}
