import { api } from "@/lib/api";

export type EstadoUsuario = "ACTIVO" | "INACTIVO";
export type TipoDocumento = "DNI" | "CE";

export type Recepcionista = {
  id: number;
  nombres: string;
  apellidos: string | null;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  estado: EstadoUsuario;
  creadoEn: string;
};

export type DatosCrearRecepcionista = {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  contrasena: string;
};

export type DatosEditarRecepcionista = Pick<DatosCrearRecepcionista, "nombres" | "apellidos" | "telefono" | "correo">;

export function nombreCompleto({ nombres, apellidos }: Pick<Recepcionista, "nombres" | "apellidos">) {
  return [nombres, apellidos]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(" ");
}

export function listarRecepcionistas(estado?: EstadoUsuario): Promise<Recepcionista[]> {
  const query = estado ? `?${new URLSearchParams({ estado })}` : "";
  return api<Recepcionista[]>(`/recepcionistas${query}`);
}

export function crearRecepcionista(datos: DatosCrearRecepcionista): Promise<Recepcionista> {
  return api<Recepcionista>("/recepcionistas", { method: "POST", body: datos });
}

export function editarRecepcionista(id: number, datos: DatosEditarRecepcionista): Promise<Recepcionista> {
  return api<Recepcionista>(`/recepcionistas/${id}`, { method: "PATCH", body: datos });
}

export function cambiarEstadoRecepcionista(id: number, estado: EstadoUsuario): Promise<Recepcionista> {
  return api<Recepcionista>(`/recepcionistas/${id}/estado`, { method: "PATCH", body: { estado } });
}

export function restablecerContrasena(id: number, contrasena: string): Promise<void> {
  return api<void>(`/recepcionistas/${id}/restablecer-contrasena`, { method: "POST", body: { contrasena } });
}
