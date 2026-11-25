import { describe, expect, it } from "vitest";
import { precioPorPersona } from "./precio-por-persona";

describe("precioPorPersona", () => {
  it("divide el turno entre los diez jugadores de fútbol 5", () => {
    expect(precioPorPersona("80.00", "FUTBOL_5")).toBe("8.00");
  });

  it("entre los catorce de fútbol 7 redondea hacia arriba al céntimo, para que alcance", () => {
    expect(precioPorPersona("150.00", "FUTBOL_7")).toBe("10.72");
  });
});
