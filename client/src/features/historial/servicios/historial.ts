export type Categoria = "CUENTAS" | "TARIFAS" | "HORARIO" | "CANCELACION" | "CANCHAS" | "MANTENIMIENTO" | "ADICIONALES" | "ACCESOS";

export type Accion =
  | "ALTA"
  | "EDICION"
  | "DESACTIVACION"
  | "REACTIVACION"
  | "ELIMINACION"
  | "RESTABLECIMIENTO_DE_CONTRASENA"
  | "BLOQUEO"
  | "LIBERACION_DE_BLOQUEO"
  | "RETIRO_DE_BLOQUEO"
  | "INICIO_DE_SESION";

export interface LineaDeDetalle {
  campo: string;
  antes: string | null;
  despues: string | null;
}

/** Un registro del historial: quién, cuándo, qué y el detalle ya escrito para leerse. */
export interface Registro {
  id: string;
  ocurridoEn: string;
  categoria: Categoria;
  accion: Accion;
  importante: boolean;
  autor: { id: number; nombre: string };
  sujeto: string | null;
  detalle: LineaDeDetalle[];
}

export interface PaginaDelHistorial {
  registros: Registro[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

export interface Autor {
  id: number;
  nombre: string;
  rol: "ADMINISTRADOR" | "RECEPCIONISTA";
}

export const CATEGORIAS: { valor: Categoria; texto: string }[] = [
  { valor: "CUENTAS", texto: "Cuentas" },
  { valor: "TARIFAS", texto: "Tarifas" },
  { valor: "HORARIO", texto: "Horario" },
  { valor: "CANCELACION", texto: "Cancelación" },
  { valor: "CANCHAS", texto: "Canchas" },
  { valor: "MANTENIMIENTO", texto: "Mantenimiento" },
  { valor: "ADICIONALES", texto: "Adicionales" },
  { valor: "ACCESOS", texto: "Accesos" },
];

export const ACCIONES: { valor: Accion; texto: string }[] = [
  { valor: "ALTA", texto: "Creación" },
  { valor: "EDICION", texto: "Edición" },
  { valor: "DESACTIVACION", texto: "Desactivación" },
  { valor: "REACTIVACION", texto: "Reactivación" },
  { valor: "ELIMINACION", texto: "Eliminación" },
  { valor: "RESTABLECIMIENTO_DE_CONTRASENA", texto: "Contraseña restablecida" },
  { valor: "BLOQUEO", texto: "Bloqueo" },
  { valor: "LIBERACION_DE_BLOQUEO", texto: "Liberación de bloqueo" },
  { valor: "RETIRO_DE_BLOQUEO", texto: "Retiro de bloqueo" },
  { valor: "INICIO_DE_SESION", texto: "Inicio de sesión" },
];

/** Las acciones que puede tener cada categoría, para no ofrecer combinaciones vacías. */
export const ACCIONES_POR_CATEGORIA: Record<Categoria, Accion[]> = {
  CUENTAS: ["ALTA", "EDICION", "DESACTIVACION", "REACTIVACION", "RESTABLECIMIENTO_DE_CONTRASENA"],
  TARIFAS: ["ALTA", "EDICION"],
  HORARIO: ["ALTA", "EDICION"],
  CANCELACION: ["ALTA", "EDICION"],
  CANCHAS: ["ALTA", "EDICION", "DESACTIVACION", "REACTIVACION", "ELIMINACION"],
  MANTENIMIENTO: ["BLOQUEO", "LIBERACION_DE_BLOQUEO", "RETIRO_DE_BLOQUEO"],
  ADICIONALES: ["ALTA", "EDICION", "DESACTIVACION", "REACTIVACION", "ELIMINACION"],
  ACCESOS: ["INICIO_DE_SESION"],
};

export const TEXTO_DE_CATEGORIA = Object.fromEntries(CATEGORIAS.map(({ valor, texto }) => [valor, texto])) as Record<Categoria, string>;
