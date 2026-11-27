import { describe, expect, it } from "vitest";
import { diaLargo, enSoles } from "./textos-del-local";

describe("textos del local", () => {
  it("escribe los montos en soles", () => {
    expect(enSoles("80.00")).toBe("S/ 80.00");
  });

  it("escribe la fecha completa sin depender del huso horario de quien mira", () => {
    expect(diaLargo("2026-11-25")).toBe("miércoles, 25 de noviembre");
  });
});
