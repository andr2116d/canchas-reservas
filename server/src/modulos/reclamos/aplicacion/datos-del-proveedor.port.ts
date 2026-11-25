export const DATOS_DEL_PROVEEDOR = Symbol('DATOS_DEL_PROVEEDOR');

/** Identificación del proveedor que va en cada hoja (DS 011-2011-PCM, art. 5). Vacío mientras no se configure. */
export interface Proveedor {
  razonSocial: string | null;
  ruc: string | null;
  direccion: string | null;
}

export interface DatosDelProveedor {
  consultar(): Promise<Proveedor>;
}
