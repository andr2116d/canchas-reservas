import { api } from "@/lib/api";

export type Rol = "ADMINISTRADOR" | "RECEPCIONISTA" | "JUGADOR";

export type Sesion = {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string | null;
  rol: Rol;
};

export type DatosLogin = { correo: string; contrasena: string };

export type UsuarioLogin = { id: number; nombres: string; rol: Rol };

export function obtenerSesion(): Promise<Sesion> {
  return api<Sesion>("/auth/me");
}

export function iniciarSesion(datos: DatosLogin): Promise<UsuarioLogin> {
  return api<UsuarioLogin>("/auth/login", { method: "POST", body: datos });
}

export function cerrarSesion(): Promise<void> {
  return api<void>("/auth/logout", { method: "POST" });
}
