import { api } from "@/lib/api";

export type TipoDocumento = "DNI" | "CE";

export type DatosRegistro = {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  contrasena: string;
};

export type JugadorRegistrado = {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string | null;
  rol: string;
};

export function registrarJugador(datos: DatosRegistro): Promise<JugadorRegistrado> {
  return api<JugadorRegistrado>("/auth/registro", { method: "POST", body: datos });
}