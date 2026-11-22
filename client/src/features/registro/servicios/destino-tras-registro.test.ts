import { describe, expect, it } from "vitest";
import { destinoTrasRegistro } from "./destino-tras-registro";

describe("destinoTrasRegistro", () => {
  it("lleva al inicio del jugador si no hay un flujo pendiente", () => {
    expect(destinoTrasRegistro(undefined)).toBe("/inicio");
    expect(destinoTrasRegistro("")).toBe("/inicio");
  });

  it("vuelve al flujo de reserva del que vino la persona", () => {
    expect(destinoTrasRegistro("/reservar/la-popular?fecha=2026-11-22&hora=19:00")).toBe(
      "/reservar/la-popular?fecha=2026-11-22&hora=19:00",
    );
  });

  it.each([
    "https://sitio-falso.com",
    "//sitio-falso.com",
    "/\\sitio-falso.com",
    "javascript:alert(1)",
    "reservar/la-popular",
  ])('ignora "%s" porque saldría de La Previa', (siguiente) => {
    expect(destinoTrasRegistro(siguiente)).toBe("/inicio");
  });
});
