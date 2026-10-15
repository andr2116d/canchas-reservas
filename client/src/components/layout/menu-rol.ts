import type { Rol } from "@/features/auth/api";

export type EnlaceMenu = { etiqueta: string; href: string };

export const MENU_ROL: Record<Rol, EnlaceMenu[]> = {
  ADMINISTRADOR: [
    { etiqueta: "Canchas", href: "/admin/canchas" },
    { etiqueta: "Tarifas", href: "/admin/tarifas" },
    { etiqueta: "Horario", href: "/admin/horario" },
    { etiqueta: "Adicionales", href: "/admin/adicionales" },
    { etiqueta: "Cancelación", href: "/admin/regla-cancelacion" },
    { etiqueta: "Recepcionistas", href: "/admin/recepcionistas" },
  ],
  RECEPCIONISTA: [{ etiqueta: "Agenda", href: "/recepcion/agenda" }],
  JUGADOR: [
    { etiqueta: "Reservar", href: "/jugador/disponibilidad" },
    { etiqueta: "Mis reservas", href: "/jugador/reservas" },
  ],
};
