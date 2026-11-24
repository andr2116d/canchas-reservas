import type { CambiosDeCancha, Cancha } from './cancha.entity';

export const CANCHA_REPOSITORY = Symbol('CANCHA_REPOSITORY');

export type AccionSobreCancha =
  | 'ALTA'
  | 'EDICION'
  | 'DESACTIVACION'
  | 'REACTIVACION'
  | 'ELIMINACION'
  | 'BLOQUEO'
  | 'LIBERACION_DE_BLOQUEO'
  | 'RETIRO_DE_BLOQUEO';

/** Quién hace un cambio y cuándo; queda en la auditoría. */
export interface Autoria {
  ejecutadoPorId: number;
  ocurridoEn: Date;
}

/** Un cambio a una cancha tal como se guarda en la auditoría. */
export interface CambioAuditado extends Autoria {
  accion: AccionSobreCancha;
  /** En una edición, el valor anterior y el nuevo de cada dato. */
  detalle?: CambiosDeCancha;
}

/** Un cambio leído de la auditoría, con los nombres para mostrarlo. */
export interface CambioRegistrado {
  accion: AccionSobreCancha;
  nombreDeLaCancha: string;
  ejecutadoPor: string;
  ocurridoEn: Date;
  detalle: CambiosDeCancha | null;
}

/** Puerto de las canchas. Cada escritura guarda su cambio en la auditoría en la misma transacción. */
export interface CanchaRepository {
  /** Todas las canchas, en el orden en que se crearon. */
  listar(): Promise<Cancha[]>;

  buscar(id: number): Promise<Cancha | undefined>;

  /** De los nombres normalizados dados, los que ya usa otra cancha. */
  nombresOcupados(
    normalizados: string[],
    exceptoId?: number,
  ): Promise<string[]>;

  /** Crea todas las canchas o ninguna. */
  registrar(canchas: Cancha[], autoria: Autoria): Promise<Cancha[]>;

  guardar(cancha: Cancha, cambio: CambioAuditado): Promise<void>;

  /** Borra la cancha; la auditoría conserva su nombre. */
  eliminar(cancha: Cancha, autoria: Autoria): Promise<void>;

  /** Los cambios más recientes primero. */
  cambios(limite: number): Promise<CambioRegistrado[]>;
}
