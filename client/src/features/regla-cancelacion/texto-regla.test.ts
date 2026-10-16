import { describe, expect, it } from "vitest";
import { textoReglaCancelacion } from "./texto-regla";

describe("texto de la regla de cancelación", () => {
  it("con crédito y plazo arma el texto de la spec", () => {
    expect(
      textoReglaCancelacion({ horasAnticipacion: 24, tipoCompensacion: "CREDITO", plazo: "sábado 17/10 a las 19:00" }),
    ).toBe(
      "Puedes cancelar hasta el sábado 17/10 a las 19:00 (24 h antes) y se te devolverá tu adelanto como crédito. Si cancelas después, el adelanto queda retenido.",
    );
  });

  it("con devolución el adelanto se devuelve en recepción", () => {
    expect(
      textoReglaCancelacion({ horasAnticipacion: 24, tipoCompensacion: "DEVOLUCION", plazo: "sábado 17/10 a las 19:00" }),
    ).toBe(
      "Puedes cancelar hasta el sábado 17/10 a las 19:00 (24 h antes) y se te devolverá tu adelanto en recepción. Si cancelas después, el adelanto queda retenido.",
    );
  });

  it("con 0 horas se puede cancelar hasta el inicio del turno, haya o no plazo", () => {
    const esperado =
      "Puedes cancelar hasta el inicio del turno y se te devolverá tu adelanto como crédito. Si cancelas después, el adelanto queda retenido.";
    expect(textoReglaCancelacion({ horasAnticipacion: 0, tipoCompensacion: "CREDITO", plazo: "martes 20/10 a las 18:00" })).toBe(
      esperado,
    );
    expect(textoReglaCancelacion({ horasAnticipacion: 0, tipoCompensacion: "CREDITO" })).toBe(esperado);
  });

  it("sin plazo indica las horas antes del inicio del turno", () => {
    expect(textoReglaCancelacion({ horasAnticipacion: 24, tipoCompensacion: "DEVOLUCION" })).toBe(
      "Puedes cancelar hasta 24 h antes del inicio del turno y se te devolverá tu adelanto en recepción. Si cancelas después, el adelanto queda retenido.",
    );
  });

  it("sin horas válidas no menciona ningún número", () => {
    expect(textoReglaCancelacion({ horasAnticipacion: null, tipoCompensacion: "CREDITO" })).toBe(
      "Puedes cancelar con la anticipación indicada y se te devolverá tu adelanto como crédito. Si cancelas después, el adelanto queda retenido.",
    );
  });
});
