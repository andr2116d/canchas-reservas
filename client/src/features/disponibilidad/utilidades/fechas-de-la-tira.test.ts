import { describe, expect, it } from "vitest";
import { fechasEntre, nombreCorto, nombreDelMes, numeroDelDia } from "./fechas-de-la-tira";

describe("fechas de la tira", () => {
  it("lista los días entre dos fechas, ambas incluidas, aunque cambie el mes", () => {
    expect(fechasEntre("2026-11-29", "2026-12-02")).toEqual(["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
    expect(fechasEntre("2026-11-24", "2026-12-24")).toHaveLength(31);
  });

  it("nombra hoy, mañana y los demás días por su día de la semana", () => {
    expect(nombreCorto("2026-11-24", "2026-11-24")).toBe("Hoy");
    expect(nombreCorto("2026-11-25", "2026-11-24")).toBe("Mañana");
    expect(nombreCorto("2026-11-26", "2026-11-24")).toBe("jue");
  });

  it("escribe el número del día y el mes", () => {
    expect(numeroDelDia("2026-12-01")).toBe(1);
    expect(nombreDelMes("2026-12-01")).toBe("Diciembre");
  });
});
