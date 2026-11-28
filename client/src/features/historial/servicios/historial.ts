export type Categoria = "CUENTAS" | "TARIFAS" | "HORARIO" | "CANCELACION" | "ADELANTO" | "PLAZO_DE_PAGO" | "CANCHAS" | "MANTENIMIENTO" | "ADICIONALES" | "ACCESOS" | "RECLAMOS" | "RESERVAS";

export type Accion =
  | "ALTA"
  | "EDICION"
  | "DESACTIVACION"
  | "REACTIVACION"
  | "ELIMINACION"
  | "RESTABLECIMIENTO_DE_CONTRASENA"
  | "CONFIRMACION_DE_DATOS"
  | "EDICION_PROPIA"
  | "CAMBIO_DE_CONTRASENA"
  | "CAMBIO_DE_CORREO"
  | "CAMBIO_DE_DOCUMENTO"
  | "BLOQUEO"
  | "LIBERACION_DE_BLOQUEO"
  | "RETIRO_DE_BLOQUEO"
  | "INICIO_DE_SESION"
  | "APERTURA"
  | "CLASIFICACION"
  | "CAMBIO_DE_TIPO"
  | "RESPUESTA"
  | "SEPARACION"
  | "EXPIRACION";

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
  /** Sin id cuando lo hizo el sistema, como una reserva que vence. */
  autor: { id: number | null; nombre: string };
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
  { valor: "ADELANTO", texto: "Adelanto" },
  { valor: "PLAZO_DE_PAGO", texto: "Plazo de pago" },
  { valor: "CANCHAS", texto: "Canchas" },
  { valor: "MANTENIMIENTO", texto: "Mantenimiento" },
  { valor: "ADICIONALES", texto: "Adicionales" },
  { valor: "ACCESOS", texto: "Accesos" },
  { valor: "RECLAMOS", texto: "Reclamos" },
  { valor: "RESERVAS", texto: "Reservas" },
];

export const ACCIONES: { valor: Accion; texto: string }[] = [
  { valor: "ALTA", texto: "Creación" },
  { valor: "EDICION", texto: "Edición" },
  { valor: "DESACTIVACION", texto: "Desactivación" },
  { valor: "REACTIVACION", texto: "Reactivación" },
  { valor: "ELIMINACION", texto: "Eliminación" },
  { valor: "RESTABLECIMIENTO_DE_CONTRASENA", texto: "Contraseña restablecida" },
  { valor: "CONFIRMACION_DE_DATOS", texto: "Datos confirmados" },
  { valor: "EDICION_PROPIA", texto: "Datos propios corregidos" },
  { valor: "CAMBIO_DE_CONTRASENA", texto: "Contraseña cambiada" },
  { valor: "CAMBIO_DE_CORREO", texto: "Correo cambiado" },
  { valor: "CAMBIO_DE_DOCUMENTO", texto: "Tipo de documento cambiado" },
  { valor: "BLOQUEO", texto: "Bloqueo" },
  { valor: "LIBERACION_DE_BLOQUEO", texto: "Liberación de bloqueo" },
  { valor: "RETIRO_DE_BLOQUEO", texto: "Retiro de bloqueo" },
  { valor: "INICIO_DE_SESION", texto: "Inicio de sesión" },
  { valor: "APERTURA", texto: "Hoja abierta" },
  { valor: "CLASIFICACION", texto: "Clasificación" },
  { valor: "CAMBIO_DE_TIPO", texto: "Queja pasada a reclamo" },
  { valor: "RESPUESTA", texto: "Respuesta" },
  { valor: "SEPARACION", texto: "Reserva separada" },
  { valor: "EXPIRACION", texto: "Reserva vencida" },
];

/** Las acciones que puede tener cada categoría, para no ofrecer combinaciones vacías. */
export const ACCIONES_POR_CATEGORIA: Record<Categoria, Accion[]> = {
  CUENTAS: [
    "ALTA",
    "EDICION",
    "DESACTIVACION",
    "REACTIVACION",
    "RESTABLECIMIENTO_DE_CONTRASENA",
    "CONFIRMACION_DE_DATOS",
    "EDICION_PROPIA",
    "CAMBIO_DE_CONTRASENA",
    "CAMBIO_DE_CORREO",
    "CAMBIO_DE_DOCUMENTO",
  ],
  TARIFAS: ["ALTA", "EDICION"],
  HORARIO: ["ALTA", "EDICION"],
  CANCELACION: ["ALTA", "EDICION"],
  ADELANTO: ["ALTA", "EDICION"],
  PLAZO_DE_PAGO: ["ALTA", "EDICION"],
  CANCHAS: ["ALTA", "EDICION", "DESACTIVACION", "REACTIVACION", "ELIMINACION"],
  MANTENIMIENTO: ["BLOQUEO", "LIBERACION_DE_BLOQUEO", "RETIRO_DE_BLOQUEO"],
  ADICIONALES: ["ALTA", "EDICION", "DESACTIVACION", "REACTIVACION", "ELIMINACION"],
  ACCESOS: ["INICIO_DE_SESION"],
  RECLAMOS: ["APERTURA", "CLASIFICACION", "CAMBIO_DE_TIPO", "RESPUESTA"],
  RESERVAS: ["SEPARACION", "EXPIRACION"],
};

export const TEXTO_DE_CATEGORIA = Object.fromEntries(CATEGORIAS.map(({ valor, texto }) => [valor, texto])) as Record<Categoria, string>;
