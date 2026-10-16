import type { Rol } from "./api";

export const RUTA_PANEL: Record<Rol, string> = {
  ADMINISTRADOR: "/admin",
  RECEPCIONISTA: "/recepcion",
  JUGADOR: "/jugador",
};

export function esRutaPrivada(ruta: string) {
  return Object.values(RUTA_PANEL).some((panel) => ruta === panel || ruta.startsWith(`${panel}/`));
}
