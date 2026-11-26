import { describe, expect, it } from "vitest";
import { aConsulta, aDireccion, leerFiltros } from "./filtros";

describe("filtros de reclamos", () => {
  it("sin parámetros muestra las por responder, la que vence primero arriba", () => {
    expect(leerFiltros({})).toEqual({ estado: "POR_RESPONDER", periodo: "TODO", orden: "VENCE_PRIMERO", pagina: 1, porPagina: 25 });
  });

  it("ignora lo que la API rechazaría en vez de provocar un error", () => {
    expect(leerFiltros({ estado: "BORRADAS", tipo: ["QUEJA"], numero: "abc", pagina: "999999999", porPagina: "30" })).toEqual(leerFiltros({}));
  });

  it("el período se vuelve la fecha de inicio contando hoy", () => {
    const consulta = aConsulta({ ...leerFiltros({}), periodo: "7", tipo: "QUEJA" }, "2026-11-25");

    expect(consulta.get("desde")).toBe("2026-11-19");
    expect(consulta.get("tipo")).toBe("QUEJA");
  });

  it("la dirección omite los valores por defecto", () => {
    expect(aDireccion(leerFiltros({}))).toBe("/administracion/reclamos");
    expect(aDireccion({ ...leerFiltros({}), estado: "VENCIDAS", pagina: 2 })).toBe("/administracion/reclamos?estado=VENCIDAS&pagina=2");
  });
});
