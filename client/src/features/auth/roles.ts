import type { Rol } from "./api";

export const RUTA_PANEL: Record<Rol, string> = {
  ADMINISTRADOR: "/admin",
  RECEPCIONISTA: "/recepcion",
  JUGADOR: "/jugador",
};
