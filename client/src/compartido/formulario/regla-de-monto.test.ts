import { describe, expect, it } from "vitest";
import { reglaDeMonto } from "./regla-de-monto";

describe("reglaDeMonto", () => {
  it.each(["15", "15.5", "15,50"])("acepta «%s»", (monto) => {
    expect(reglaDeMonto(monto)).toBeUndefined();
  });

  it.each([
    ["", "Ingresa el monto."],
    ["0", "El monto debe ser mayor que cero."],
    ["0,00", "El monto debe ser mayor que cero."],
    ["-5", "Ingresa el monto en soles, por ejemplo 50 o 49.90."],
    ["1.999", "Usa como máximo dos decimales."],
    ["100000", "El monto no puede pasar de S/ 99999.99."],
  ])("rechaza «%s»", (monto, mensaje) => {
    expect(reglaDeMonto(monto)).toBe(mensaje);
  });
});
