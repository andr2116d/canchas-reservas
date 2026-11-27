export const CATALOGO_DE_ADICIONALES = Symbol('CATALOGO_DE_ADICIONALES');

/** Material del local que se puede pedir al reservar, con su precio por unidad perdida o rota. */
export interface AdicionalOfrecido {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
}

export interface CatalogoDeAdicionales {
  /** Solo los activos, en el orden del catálogo. */
  activos(): Promise<AdicionalOfrecido[]>;
}
