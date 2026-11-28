import { describe, expect, it } from "vitest";
import { aConsulta, aDireccion, leerFiltros } from "./filtros";

describe("leerFiltros", () => {
  it("sin nada en la dirección no filtra y deja la fecha al server", () => {
    expect(leerFiltros(new URLSearchParams())).toEqual({});
  });

  it("lee la fecha, la cancha y el estado válidos", () => {
    const filtros = leerFiltros(new URLSearchParams("fecha=2026-11-28&cancha=2&estado=CONFIRMADA"));

    expect(filtros).toEqual({ fecha: "2026-11-28", canchaId: "2", estado: "CONFIRMADA" });
  });

  it.each([
    ["fecha=28-11-2026"],
    ["fecha=2026-11-28x"],
    ["cancha=abc"],
    ["cancha=0"],
    ["cancha=99999999999"],
    ["estado=CANCELADA"],
  ])("ignora lo que no pasaría los topes de la API: %s", (direccion) => {
    expect(leerFiltros(new URLSearchParams(direccion))).toEqual({});
  });
});

describe("aConsulta", () => {
  it("arma la consulta de la API con los nombres que espera", () => {
    const consulta = aConsulta({ fecha: "2026-11-28", canchaId: "2", estado: "EN_JUEGO" });

    expect(consulta.toString()).toBe("fecha=2026-11-28&canchaId=2&estado=EN_JUEGO");
  });
});

describe("aDireccion", () => {
  it("escribe en la dirección solo los filtros elegidos", () => {
    expect(aDireccion("/recepcion", { fecha: "2026-11-28", estado: "CONFIRMADA" })).toBe("/recepcion?fecha=2026-11-28&estado=CONFIRMADA");
    expect(aDireccion("/recepcion", { canchaId: "3" })).toBe("/recepcion?cancha=3");
    expect(aDireccion("/administracion/agenda", {})).toBe("/administracion/agenda");
  });
});
