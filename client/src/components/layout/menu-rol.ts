import type { Rol } from "@/features/auth/api";

export type EnlaceMenu = { etiqueta: string; href: string; secciones?: string[] };

export const MENU_ROL: Record<Rol, EnlaceMenu[]> = {
  ADMINISTRADOR: [
    { etiqueta: "Canchas", href: "/admin/canchas" },
    { etiqueta: "Tarifas", href: "/admin/tarifas" },
    { etiqueta: "Horario", href: "/admin/horario" },
    { etiqueta: "Adicionales", href: "/admin/adicionales" },
    { etiqueta: "Cancelación", href: "/admin/regla-cancelacion" },
    { etiqueta: "Recepcionistas", href: "/admin/recepcionistas" },
    { etiqueta: "Actividad", href: "/admin/actividad" },
  ],
  RECEPCIONISTA: [
    { etiqueta: "Disponibilidad", href: "/recepcion/disponibilidad" },
    { etiqueta: "Agenda", href: "/recepcion/agenda" },
  ],
  JUGADOR: [
    { etiqueta: "Reservar", href: "/jugador/disponibilidad", secciones: ["/jugador/reservas/confirmar"] },
    { etiqueta: "Mis reservas", href: "/jugador/reservas" },
  ],
};

function coincide(pathname: string, ruta: string) {
  return pathname === ruta || pathname.startsWith(`${ruta}/`);
}

function largoCoincidencia(enlace: EnlaceMenu, pathname: string) {
  const rutas = [enlace.href, ...(enlace.secciones ?? [])].filter((ruta) => coincide(pathname, ruta));
  return Math.max(0, ...rutas.map((ruta) => ruta.length));
}

export function enlaceActivo(enlaces: EnlaceMenu[], pathname: string) {
  let activo: EnlaceMenu | undefined;
  let mejor = 0;
  for (const enlace of enlaces) {
    const largo = largoCoincidencia(enlace, pathname);
    if (largo > mejor) {
      activo = enlace;
      mejor = largo;
    }
  }
  return activo;
}
