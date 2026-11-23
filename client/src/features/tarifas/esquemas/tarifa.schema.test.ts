import { describe, expect, it } from "vitest";
import { esquemaDeTarifa } from "./tarifa.schema";

function errores(datos: Record<string, string>) {
  const resultado = esquemaDeTarifa.safeParse({
    precioDia: "50",
    precioNoche: "100",
    duracionDelTurno: "3",
    ...datos,
  });
  return resultado.success
    ? {}
    : Object.fromEntries(
        resultado.error.issues.map((i) => [i.path[0], i.message]),
      );
}

describe("esquemaDeTarifa", () => {
  it("acepta montos con céntimos y el mismo precio de día y de noche", () => {
    expect(errores({ precioDia: "49,90", precioNoche: "49.9" })).toEqual({});
  });

  it.each([
    ["0", "El monto debe ser mayor que cero."],
    ["-5", "Ingresa el monto en soles, por ejemplo 50 o 49.90."],
    ["abc", "Ingresa el monto en soles, por ejemplo 50 o 49.90."],
    ["", "Ingresa el monto."],
    ["10.555", "Usa como máximo dos decimales."],
  ])("rechaza el monto «%s»", (monto, mensaje) => {
    expect(errores({ precioNoche: monto })).toEqual({ precioNoche: mensaje });
  });

  it.each(["0", "13", "1.5"])("rechaza un turno de «%s» horas", (horas) => {
    expect(errores({ duracionDelTurno: horas })).toEqual({
      duracionDelTurno: "Elige un turno de 1 a 12 horas enteras.",
    });
  });
});
