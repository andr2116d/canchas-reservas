export type EstadoDeAdicional = "ACTIVO" | "DESACTIVADO";

/** Material que el local presta en la cancha y su precio por unidad perdida o rota. */
export interface Adicional {
  id: number;
  nombre: string;
  descripcion: string | null;
  /** Soles con dos decimales, como «15.50». */
  precio: string;
  estado: EstadoDeAdicional;
  /** Solo si nunca se usó; si se usó, se desactiva. */
  sePuedeEliminar: boolean;
}

/** Lo que escribe administración; la descripción vacía se guarda como ausente. */
export interface DatosDeAdicional {
  nombre: string;
  descripcion: string;
  precio: string;
}

export type AccionSobreAdicional = "ALTA" | "EDICION" | "DESACTIVACION" | "REACTIVACION" | "ELIMINACION";

export interface ResumenDeAdicional {
  nombre: string;
  descripcion: string | null;
  precio: string;
}

export type CambiosDeAdicional = Partial<Record<keyof ResumenDeAdicional, { antes: string | null; despues: string | null }>>;

/** Un cambio de la auditoría. En un alta, el detalle son sus valores; en una edición, el antes y el después. */
export interface CambioDeAdicional {
  accion: AccionSobreAdicional;
  nombreDelAdicional: string;
  ejecutadoPor: string;
  ocurridoEn: string;
  detalle: ResumenDeAdicional | CambiosDeAdicional | null;
}

