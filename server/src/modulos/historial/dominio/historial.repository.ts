import type { RegistroSinDescribir } from './describir-registro';
import type { FiltroDelHistorial } from './filtro-del-historial';

export const HISTORIAL_REPOSITORY = Symbol('HISTORIAL_REPOSITORY');

/** Quién hizo un cambio, con su nombre ya legible. */
export interface Autor {
  id: number;
  nombre: string;
  rol: 'ADMINISTRADOR' | 'RECEPCIONISTA';
}

/** Quien hizo un registro: una cuenta o, si nadie lo hizo (una reserva que vence), el sistema. */
export interface AutorDelRegistro {
  id: number | null;
  nombre: string;
}

export const AUTOR_SISTEMA: AutorDelRegistro = { id: null, nombre: 'Sistema' };

/** Un registro tal como sale de la base, con el nombre de quien lo hizo. */
export interface RegistroGuardado extends RegistroSinDescribir {
  /** Único entre todas las fuentes, como `cancha-12`. */
  id: string;
  ocurridoEn: Date;
  importante: boolean;
  autor: AutorDelRegistro;
}

/** Puerto de solo lectura: el historial no se edita ni se borra. */
export interface HistorialRepository {
  /** Una página de registros que cumplen el filtro y cuántos hay en total. */
  buscar(
    filtro: FiltroDelHistorial,
  ): Promise<{ registros: RegistroGuardado[]; total: number }>;

  /** Quienes tienen al menos un registro, para filtrar por persona. */
  autores(): Promise<Autor[]>;
}
