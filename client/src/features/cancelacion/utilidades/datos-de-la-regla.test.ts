import { describe, expect, it } from "vitest";
import { duracionEnTexto, ordenarRangos, posicionDelRango, rangoNuevo, rangosDelFormulario } from "./datos-de-la-regla";

const rango = (desdeHoras: string, porcentaje = "100") => ({ desdeHoras, porcentaje, ofreceCredito: false });

describe("datos de la regla", () => {
  it("sin regla guardada propone la del negocio para empezar", () => {
    const rangos = rangosDelFormulario({ historial: [], propuesta: [{ desdeHoras: 2, porcentaje: 100, ofreceCredito: true }] });

    expect(rangos).toEqual([{ desdeHoras: "2", porcentaje: "100", ofreceCredito: true }]);
  });

  it("ordena de más a menos anticipación y deja al final las horas que faltan", () => {
    expect(ordenarRangos([rango("0"), rango(""), rango("24"), rango("2")]).map((r) => r.desdeHoras)).toEqual(["24", "2", "0", ""]);
  });

  it("un rango nuevo usa horas libres y el porcentaje del primer rango", () => {
    expect(rangoNuevo([rango("2", "90"), rango("0", "0"), rango("3")])).toEqual({ desdeHoras: "4", porcentaje: "100", ofreceCredito: false });
  });

  it("un rango nuevo entra en su lugar, de más a menos anticipación", () => {
    expect(posicionDelRango([rango("24"), rango("2"), rango("0")], rango("6"))).toBe(1);
    expect(posicionDelRango([rango("2"), rango("0")], rango("48"))).toBe(0);
  });

  it("escribe la anticipación en horas y minutos", () => {
    expect([duracionEnTexto(45), duracionEnTexto(120), duracionEnTexto(90)]).toEqual(["45 min", "2 h", "1 h 30 min"]);
  });
});
