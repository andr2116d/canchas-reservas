import { describe, expect, it } from "vitest";
import { esquemaRegla, MENSAJES_REGLA } from "./schemas";

function primerError(horasAnticipacion: unknown, tipoCompensacion: unknown = "CREDITO") {
  const resultado = esquemaRegla.safeParse({ horasAnticipacion, tipoCompensacion });
  return resultado.success ? null : resultado.error.issues[0].message;
}

describe("esquema de la regla de cancelación", () => {
  it.each(["", "  ", "abc", "1.5", "24h", undefined])("rechaza %j porque no es un número entero", (horas) => {
    expect(primerError(horas)).toBe(MENSAJES_REGLA.horasEntero);
  });

  it("rechaza horas negativas", () => {
    expect(primerError("-1")).toBe(MENSAJES_REGLA.horasMinimo);
  });

  it("rechaza horas mayores que el tope del servidor", () => {
    expect(primerError("2147483648")).toBe(MENSAJES_REGLA.horasMaximo);
  });

  it.each([
    ["0", 0],
    ["24", 24],
    [" 48 ", 48],
    ["2147483647", 2147483647],
  ])("acepta %j", (horas, esperado) => {
    expect(esquemaRegla.parse({ horasAnticipacion: horas, tipoCompensacion: "DEVOLUCION" })).toEqual({
      horasAnticipacion: esperado,
      tipoCompensacion: "DEVOLUCION",
    });
  });

  it.each(["OTRO", "", "credito", null])("rechaza el tipo de compensación %j", (tipo) => {
    expect(primerError("24", tipo)).toBe(MENSAJES_REGLA.tipoCompensacion);
  });
});
