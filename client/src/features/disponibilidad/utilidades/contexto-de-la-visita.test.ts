import { describe, expect, it } from "vitest";
import { contextoDeLaVisita } from "./contexto-de-la-visita";

describe("contextoDeLaVisita", () => {
  it("sin sesión, el mapa invita a ingresar o crear la cuenta", () => {
    expect(contextoDeLaVisita(undefined)).toBe("publico");
  });

  it("con la sesión de un jugador, el mapa deja reservar el turno elegido", () => {
    expect(contextoDeLaVisita({ rol: "JUGADOR" })).toBe("jugador");
  });

  it("el personal mira el mapa como el público: reserva desde su panel", () => {
    expect(contextoDeLaVisita({ rol: "RECEPCIONISTA" })).toBe("publico");
    expect(contextoDeLaVisita({ rol: "ADMINISTRADOR" })).toBe("publico");
  });
});
