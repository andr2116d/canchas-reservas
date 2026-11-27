import { describe, expect, it } from "vitest";
import { momentoDelLocal, saldoEnElLocal, textoDelPlazo, tiempoRestante } from "./textos-de-la-reserva";

describe("textos de la reserva", () => {
  it("escribe un momento con el día y la hora de Lima", () => {
    expect(momentoDelLocal("2026-11-28T00:00:00.000Z")).toBe("vie 27 nov, 19:00");
  });

  it("dice cuánto se devuelve en cada plazo, y que el crédito es opcional", () => {
    const hasta = "2026-11-28T00:00:00.000Z";

    expect(textoDelPlazo({ hasta, porcentaje: 100, ofreceCredito: true })).toEqual({
      cuando: "Hasta el vie 27 nov, 19:00",
      que: "Se devuelve el 100 % del adelanto, o crédito si lo prefieres",
    });
    expect(textoDelPlazo({ hasta, porcentaje: 50, ofreceCredito: false }).que).toBe("Se devuelve el 50 % del adelanto");
    expect(textoDelPlazo({ hasta, porcentaje: 0, ofreceCredito: false }).que).toBe("El adelanto no se devuelve");
  });

  it("resta el adelanto del precio sin perder céntimos", () => {
    expect(saldoEnElLocal("80.00", "40.00")).toBe("40.00");
    expect(saldoEnElLocal("83.33", "41.67")).toBe("41.66");
    expect(saldoEnElLocal("50.10", "50.10")).toBe("0.00");
  });

  it("escribe el tiempo que falta en minutos y segundos", () => {
    expect(tiempoRestante(15 * 60)).toBe("15:00");
    expect(tiempoRestante(65)).toBe("1:05");
    expect(tiempoRestante(0)).toBe("0:00");
  });
});
