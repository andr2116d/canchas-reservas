import { describe, expect, it } from "vitest";
import { reglaEnPalabras } from "./regla-en-palabras";

describe("reglaEnPalabras", () => {
  it("escribe cada rango con su anticipación y lo que se devuelve", () => {
    expect(
      reglaEnPalabras([
        { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
        { desdeHoras: 24, porcentaje: 100, ofreceCredito: true },
        { desdeHoras: 2, porcentaje: 50, ofreceCredito: false },
      ]),
    ).toEqual([
      { cuando: "24 horas antes o más", devolucion: "100 % del adelanto, en dinero o como crédito" },
      { cuando: "Entre 2 horas y 24 horas antes", devolucion: "50 % del adelanto, en dinero" },
      { cuando: "Menos de 2 horas antes", devolucion: "No se devuelve el adelanto" },
    ]);
  });

  it("con un solo rango desde 0 horas rige siempre", () => {
    expect(reglaEnPalabras([{ desdeHoras: 0, porcentaje: 100, ofreceCredito: false }])).toEqual([
      { cuando: "En cualquier momento antes de empezar", devolucion: "100 % del adelanto, en dinero" },
    ]);
  });

  it("dice «1 hora» en singular", () => {
    expect(reglaEnPalabras([{ desdeHoras: 1, porcentaje: 50, ofreceCredito: false }, { desdeHoras: 0, porcentaje: 0, ofreceCredito: false }])[1].cuando).toBe("Menos de 1 hora antes");
  });
});
