/** Etapas de una reserva que ocupan su turno, las mismas que la exclusión de la base. */
export const ESTADOS_QUE_OCUPAN = [
  'PENDIENTE_DE_PAGO',
  'PENDIENTE_DE_VALIDACION',
  'CONFIRMADA',
  'EN_JUEGO',
] as const;
export type EstadoDeReserva = (typeof ESTADOS_QUE_OCUPAN)[number];

export function ocupaElTurno(estado: string): estado is EstadoDeReserva {
  return (ESTADOS_QUE_OCUPAN as readonly string[]).includes(estado);
}

/** Cómo se ve un turno de una cancha. Solo `DISPONIBLE` se puede elegir. */
export type EstadoDelTurno =
  | 'DISPONIBLE'
  | 'PENDIENTE'
  | 'OCUPADO'
  | 'MANTENIMIENTO'
  | 'SIN_LUZ'
  | 'YA_EMPEZO';

/** Con el pago validado el turno se ve ocupado; antes, pendiente. */
const SE_VEN_OCUPADAS: EstadoDeReserva[] = ['CONFIRMADA', 'EN_JUEGO'];

interface Rango {
  inicio: Date;
  fin: Date;
}

export interface TurnoDeUnaCancha extends Rango {
  canchaId: number;
  /** El turno llega a la noche y la cancha no tiene luz. */
  necesitaLuzSinTenerla: boolean;
}

export interface OcupacionConocida {
  reservas: (Rango & { canchaId: number; estado: EstadoDeReserva })[];
  bloqueos: (Rango & { canchaId: number })[];
  ahora: Date;
}

/**
 * Estado de un turno: sin luz, en mantenimiento si toca un bloqueo (aunque sea en
 * parte), ocupado o pendiente según sus reservas y, si nada lo ocupa, ya empezado o libre.
 */
export function estadoDelTurno(
  turno: TurnoDeUnaCancha,
  { reservas, bloqueos, ahora }: OcupacionConocida,
): EstadoDelTurno {
  const cruza = (otro: Rango & { canchaId: number }) =>
    otro.canchaId === turno.canchaId &&
    otro.inicio < turno.fin &&
    turno.inicio < otro.fin;
  if (turno.necesitaLuzSinTenerla) return 'SIN_LUZ';
  if (bloqueos.some(cruza)) return 'MANTENIMIENTO';
  const suyas = reservas.filter(cruza);
  if (suyas.some((reserva) => SE_VEN_OCUPADAS.includes(reserva.estado)))
    return 'OCUPADO';
  if (suyas.length > 0) return 'PENDIENTE';
  return turno.inicio <= ahora ? 'YA_EMPEZO' : 'DISPONIBLE';
}
