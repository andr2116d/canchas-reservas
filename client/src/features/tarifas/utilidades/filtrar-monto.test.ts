import { describe, expect, it } from "vitest";
import { filtrarMonto } from "./filtrar-monto";

describe("filtrarMonto", () => {
  it.each([
    ["50", "50"],
    ["49.90", "49.90"],
    ["49,9", "49,9"],
    ["-50", "50"],
    ["5a0", "50"],
    ["49.999", "49.99"],
    ["4.9.9", "4.99"],
    ["1e3", "13"],
  ])("deja «%s» como «%s»", (escrito, esperado) => {
    expect(filtrarMonto(escrito)).toBe(esperado);
  });
});
