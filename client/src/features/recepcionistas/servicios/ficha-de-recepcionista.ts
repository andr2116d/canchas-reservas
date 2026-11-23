import type { TipoDocumento } from "@/compartido/formulario/reglas-de-datos-personales";

/** Datos de una recepcionista tal como los devuelve la API. */
export interface FichaDeRecepcionista {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  fechaNacimiento: string;
  celular: string;
  estado: "ACTIVO" | "INACTIVO";
  requiereCambiarContrasena: boolean;
  creadaEn: string;
}

export type AccionAuditada =
  | "ALTA"
  | "EDICION"
  | "DESACTIVACION"
  | "REACTIVACION"
  | "RESTABLECIMIENTO_DE_CONTRASENA";

export interface AccionDelHistorial {
  accion: AccionAuditada;
  ocurridoEn: string;
  ejecutadoPor: string;
}

export interface FichaConHistorial {
  ficha: FichaDeRecepcionista;
  historial: AccionDelHistorial[];
}

export type EstadoDelListado = "activas" | "desactivadas";

export const NOMBRE_DEL_DOCUMENTO: Record<TipoDocumento, string> = {
  DNI: "DNI",
  CARNE_EXTRANJERIA: "Carné",
};
