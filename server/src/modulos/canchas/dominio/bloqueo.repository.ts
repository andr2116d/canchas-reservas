import type { Bloqueo } from './bloqueo.entity';
import type { Autoria } from './cancha.repository';
import type { Rango } from './repeticion';

export const BLOQUEO_REPOSITORY = Symbol('BLOQUEO_REPOSITORY');

/** Un bloqueo con el nombre de su cancha, para mostrarlo. */
export interface BloqueoDeLaCancha {
  bloqueo: Bloqueo;
  cancha: string;
}

/** Puerto de los bloqueos por mantenimiento. Cada escritura deja su cambio en la auditoría de la cancha. */
export interface BloqueoRepository {
  /** Bloqueos de esas canchas que se cruzan con alguno de los rangos. */
  chocan(canchaIds: number[], rangos: Rango[]): Promise<BloqueoDeLaCancha[]>;

  /** Guarda todos o ninguno. */
  registrar(bloqueos: Bloqueo[], autoria: Autoria): Promise<Bloqueo[]>;

  buscar(id: number): Promise<BloqueoDeLaCancha | undefined>;

  liberar(bloqueo: Bloqueo, autoria: Autoria): Promise<void>;

  quitar(bloqueo: Bloqueo, autoria: Autoria): Promise<void>;

  /** Los que no terminaron en ese momento, el más próximo primero. */
  sinTerminar(ahora: Date): Promise<BloqueoDeLaCancha[]>;

  /** Los últimos que terminaron, el más reciente primero. */
  terminados(ahora: Date, limite: number): Promise<BloqueoDeLaCancha[]>;
}
