import type {
  Adicional,
  CambiosDeAdicional,
  ResumenDeAdicional,
} from './adicional.entity';

export const ADICIONAL_REPOSITORY = Symbol('ADICIONAL_REPOSITORY');

export type AccionSobreAdicional =
  'ALTA' | 'EDICION' | 'DESACTIVACION' | 'REACTIVACION' | 'ELIMINACION';

/** En un alta, los valores con que se creó; en una edición, el antes y el después de lo que cambió. */
export type DetalleDeCambio = ResumenDeAdicional | CambiosDeAdicional;

/** Quién hace un cambio y cuándo; queda en la auditoría. */
export interface Autoria {
  ejecutadoPorId: number;
  ocurridoEn: Date;
}

/** Un cambio a un adicional tal como se guarda en la auditoría. */
export interface CambioAuditado extends Autoria {
  accion: AccionSobreAdicional;
  detalle?: DetalleDeCambio;
}

/** Un cambio leído de la auditoría, con los nombres para mostrarlo. */
export interface CambioRegistrado {
  accion: AccionSobreAdicional;
  nombreDelAdicional: string;
  ejecutadoPor: string;
  ocurridoEn: Date;
  detalle: DetalleDeCambio | null;
}

/** Puerto de los adicionales. Cada escritura guarda su cambio en la auditoría en la misma transacción. */
export interface AdicionalRepository {
  /** Todos, en el orden en que se crearon. */
  listar(): Promise<Adicional[]>;

  buscar(id: number): Promise<Adicional | undefined>;

  /** Si otro adicional ya usa ese nombre normalizado. */
  nombreOcupado(normalizado: string, exceptoId?: number): Promise<boolean>;

  /** Lo crea y deja su alta, con sus valores, en la auditoría. */
  registrar(adicional: Adicional, autoria: Autoria): Promise<Adicional>;

  guardar(adicional: Adicional, cambio: CambioAuditado): Promise<void>;

  /** Lo borra; la auditoría conserva su nombre. */
  eliminar(adicional: Adicional, autoria: Autoria): Promise<void>;

  /** Los cambios más recientes primero. */
  cambios(limite: number): Promise<CambioRegistrado[]>;
}
