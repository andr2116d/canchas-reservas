import { describe, expect, it } from "vitest";
import { MENU_ROL } from "./menu-rol";

describe("menú por rol", () => {
  it("el administrador tiene Actividad al final del menú", () => {
    expect(MENU_ROL.ADMINISTRADOR.at(-1)).toEqual({ etiqueta: "Actividad", href: "/admin/actividad" });
  });

  it.each(["RECEPCIONISTA", "JUGADOR"] as const)("%s no ve Actividad", (rol) => {
    expect(MENU_ROL[rol].map((enlace) => enlace.href)).not.toContain("/admin/actividad");
  });
});
