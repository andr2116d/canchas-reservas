import { describe, expect, it } from "vitest";
import { diaYHoraEnLima, fecha, horaEnLima, moneda } from "./formato";

describe("formato", () => {
  it("moneda", () => {
    expect(moneda(50)).toBe("S/ 50.00");
    expect(moneda("2.5")).toBe("S/ 2.50");
  });

  it("fecha", () => {
    expect(fecha("2026-10-20")).toBe("20/10/2026");
  });

  it("hora en Lima", () => {
    expect(horaEnLima("2026-10-20T23:00:00Z")).toBe("18:00");
  });

  it("día y hora en Lima", () => {
    expect(diaYHoraEnLima("2026-10-18T00:00:00Z")).toBe("sábado 17/10 a las 19:00");
  });
});
