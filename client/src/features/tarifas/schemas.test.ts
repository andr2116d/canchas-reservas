import { describe, expect, it } from "vitest";
import { calcularAdelanto } from "./api";
import { decimal } from "@/lib/filtros-entrada";
import { esquemaTarifa, MENSAJES_TARIFA } from "./schemas";

function primerError(valor: string) {
  const resultado = esquemaTarifa.safeParse({ valor });
  return resultado.success ? null : resultado.error.issues[0].message;
}

describe("esquema de tarifa", () => {
  it.each(["", "  ", "abc", "0", "0.00", "-5"])("rechaza %j con el mensaje de mayor que 0", (valor) => {
    expect(primerError(valor)).toBe(MENSAJES_TARIFA.valorPositivo);
  });

  it("rechaza más de 2 decimales", () => {
    expect(primerError("10.999")).toBe(MENSAJES_TARIFA.valorDecimales);
  });

  it("rechaza valores mayores que 9999.99", () => {
    expect(primerError("10000")).toBe(MENSAJES_TARIFA.valorMaximo);
  });

  it.each([
    ["80", 80],
    ["55.05", 55.05],
    [" 0.01 ", 0.01],
    ["9999.99", 9999.99],
  ])("acepta %j", (valor, esperado) => {
    expect(esquemaTarifa.parse({ valor })).toEqual({ valor: esperado });
  });

  it("sanea el texto: coma como punto, sin signos y con hasta 2 decimales", () => {
    expect(decimal("55,05")).toBe("55.05");
    expect(decimal("-80")).toBe("80");
    expect(decimal("1.2.345")).toBe("1.23");
    expect(decimal("1e3")).toBe("13");
  });
});

describe("calcularAdelanto", () => {
  it.each([
    [80, 40],
    [55.05, 27.53],
    [75.5, 37.75],
    [1.15, 0.58],
    [0.01, 0.01],
    [9999.99, 5000],
  ])("el adelanto de %d es %d", (valor, adelanto) => {
    expect(calcularAdelanto(valor)).toBe(adelanto);
  });
});
