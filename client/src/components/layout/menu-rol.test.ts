import { describe, expect, it } from "vitest";
import { MENU_ROL, enlaceActivo, type EnlaceMenu } from "./menu-rol";

describe("menú por rol", () => {
  it("el administrador tiene Actividad al final del menú", () => {
    expect(MENU_ROL.ADMINISTRADOR.at(-1)).toEqual({ etiqueta: "Actividad", href: "/admin/actividad" });
  });

  it.each(["RECEPCIONISTA", "JUGADOR"] as const)("%s no ve Actividad", (rol) => {
    expect(MENU_ROL[rol].map((enlace) => enlace.href)).not.toContain("/admin/actividad");
  });
});

describe("enlace activo del menú", () => {
  const etiquetaActiva = (enlaces: EnlaceMenu[], pathname: string) => enlaceActivo(enlaces, pathname)?.etiqueta;

  it.each([
    ["/jugador/reservas/confirmar", "Reservar"],
    ["/jugador/reservas", "Mis reservas"],
    ["/jugador/disponibilidad", "Reservar"],
  ])("en %s marca %s", (pathname, etiqueta) => {
    expect(etiquetaActiva(MENU_ROL.JUGADOR, pathname)).toBe(etiqueta);
  });

  it("en el panel del jugador no marca ninguno", () => {
    expect(enlaceActivo(MENU_ROL.JUGADOR, "/jugador")).toBeUndefined();
  });

  it.each([
    ["ADMINISTRADOR", "/admin/regla-cancelacion", "Cancelación"],
    ["ADMINISTRADOR", "/admin/canchas", "Canchas"],
    ["RECEPCIONISTA", "/recepcion/agenda", "Agenda"],
    ["RECEPCIONISTA", "/recepcion/disponibilidad", "Disponibilidad"],
  ] as const)("%s en %s marca %s", (rol, pathname, etiqueta) => {
    expect(etiquetaActiva(MENU_ROL[rol], pathname)).toBe(etiqueta);
  });

  it("no confunde rutas que solo comparten el comienzo", () => {
    const enlaces = [{ etiqueta: "Reservas", href: "/jugador/reservas" }];
    expect(enlaceActivo(enlaces, "/jugador/reservas-viejas")).toBeUndefined();
  });

  it("elige la coincidencia más larga sin importar el orden", () => {
    const enlaces = [
      { etiqueta: "General", href: "/a" },
      { etiqueta: "Detalle", href: "/otra", secciones: ["/a/b"] },
    ];
    expect(etiquetaActiva(enlaces, "/a/b/c")).toBe("Detalle");
    expect(etiquetaActiva([...enlaces].reverse(), "/a/b/c")).toBe("Detalle");
    expect(etiquetaActiva(enlaces, "/a/x")).toBe("General");
  });
});
