import type { Rol } from "../sesion/destino-de-sesion";

export interface Seccion {
  ruta: string;
  texto: string;
}

/** Nombre del panel de cada rol, tal como se muestra en la barra. */
export const NOMBRE_DEL_PANEL: Record<Rol, string> = {
  JUGADOR: "Jugador",
  RECEPCIONISTA: "Recepción",
  ADMINISTRADOR: "Administración",
};

/** Secciones de cada panel. La primera es el inicio del rol. */
export const SECCIONES_DEL_PANEL: Record<Rol, Seccion[]> = {
  JUGADOR: [
    { ruta: "/inicio", texto: "Inicio" },
    { ruta: "/inicio/reservar", texto: "Reservar" },
    { ruta: "/inicio/mis-reservas", texto: "Mis reservas" },
  ],
  RECEPCIONISTA: [
    { ruta: "/recepcion", texto: "Agenda" },
    { ruta: "/recepcion/disponibilidad", texto: "Disponibilidad" },
  ],
  ADMINISTRADOR: [
    { ruta: "/administracion", texto: "Resumen" },
    { ruta: "/administracion/recepcionistas", texto: "Recepcionistas" },
    { ruta: "/administracion/reglas-de-reserva", texto: "Reglas de reserva" },
    { ruta: "/administracion/canchas", texto: "Canchas" },
    { ruta: "/administracion/adicionales", texto: "Adicionales" },
    { ruta: "/administracion/reclamos", texto: "Reclamos" },
  ],
};

/** Cuenta propia, dentro del panel de cada rol. */
export const RUTA_DE_LA_CUENTA: Record<Rol, string> = {
  JUGADOR: "/inicio/cuenta",
  RECEPCIONISTA: "/recepcion/cuenta",
  ADMINISTRADOR: "/administracion/cuenta",
};

/** Opciones del menú de la cuenta de cada rol; «Cerrar sesión» va siempre al final. */
export const OPCIONES_DE_LA_CUENTA: Record<Rol, Seccion[]> = {
  JUGADOR: [
    { ruta: RUTA_DE_LA_CUENTA.JUGADOR, texto: "Ver mi cuenta" },
    { ruta: "/inicio/reclamos", texto: "Mis reclamos" },
  ],
  RECEPCIONISTA: [{ ruta: RUTA_DE_LA_CUENTA.RECEPCIONISTA, texto: "Ver mi cuenta" }],
  ADMINISTRADOR: [
    { ruta: RUTA_DE_LA_CUENTA.ADMINISTRADOR, texto: "Ver mi cuenta" },
    { ruta: "/administracion/historial", texto: "Historial de cambios" },
  ],
};

/** El inicio del rol solo está activo en su ruta exacta; las demás, también en sus subrutas. */
export function esSeccionActual(seccion: Seccion, inicio: string, rutaActual: string): boolean {
  if (seccion.ruta === inicio) return rutaActual === inicio;
  return rutaActual === seccion.ruta || rutaActual.startsWith(seccion.ruta + "/");
}
