import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';

export const CATALOGO_DEL_CLUB = Symbol('CATALOGO_DEL_CLUB');

/** Una cancha operativa con lo que se muestra en la portada. */
export interface CanchaDelClub {
  id: number;
  nombre: string;
  tipo: TipoDeCancha;
  tieneIluminacion: boolean;
  caracteristicas: string[];
  nota: string | null;
}

/** Un adicional activo con su precio por unidad perdida o rota. */
export interface AdicionalDelClub {
  nombre: string;
  descripcion: string | null;
  precio: string;
}

/** Lo que el club muestra al público de sus canchas y adicionales. Nada desactivado. */
export interface CatalogoDelClub {
  canchasOperativas(): Promise<CanchaDelClub[]>;
  adicionalesActivos(): Promise<AdicionalDelClub[]>;
}
