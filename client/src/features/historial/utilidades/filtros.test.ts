import { describe, expect, it } from "vitest";
import { aConsulta, FILTROS_INICIALES, hayFiltros, leerFiltros, periodoDe, rangoDelPeriodo } from "./filtros";

describe("leerFiltros", () => {
  it("sin parámetros: todo, lo más reciente primero, 25 por página", () => {
    expect(leerFiltros({})).toEqual({ filtros: FILTROS_INICIALES });
  });

  it("lee los filtros válidos de la dirección", () => {
    const { filtros } = leerFiltros({
      autor: "7",
      categoria: "TARIFAS",
      accion: "EDICION",
      desde: "2026-11-20",
      hasta: "2026-11-24",
      importantes: "1",
      orden: "antiguos",
      pagina: "2",
      porPagina: "50",
    });

    expect(filtros).toEqual({
      autor: "7",
      categoria: "TARIFAS",
      accion: "EDICION",
      desde: "2026-11-20",
      hasta: "2026-11-24",
      soloImportantes: true,
      orden: "ANTIGUOS",
      pagina: 2,
      porPagina: 50,
    });
  });

  it("si la fecha final es anterior a la inicial, no filtra por fechas y dice por qué", () => {
    const leido = leerFiltros({ desde: "2026-11-24", hasta: "2026-11-20" });

    expect(leido.filtros.desde).toBe("");
    expect(leido.filtros.hasta).toBe("");
    expect(leido.aviso).toBe("La fecha final es anterior a la inicial, así que no se filtró por fechas.");
  });

  it("ignora valores que no son de la lista", () => {
    expect(leerFiltros({ categoria: "PAGOS", accion: "BORRAR", porPagina: "999", pagina: "-3", autor: "x" })).toEqual({ filtros: FILTROS_INICIALES });
  });

  it("ignora una persona o una página fuera de rango", () => {
    expect(leerFiltros({ autor: "99999999999", pagina: "100001" })).toEqual({ filtros: FILTROS_INICIALES });
  });

  it("descarta una acción que no corresponde a la categoría", () => {
    expect(leerFiltros({ categoria: "ACCESOS", accion: "ELIMINACION" }).filtros.accion).toBe("");
  });
});

describe("aConsulta", () => {
  it("solo envía lo que filtra, con los nombres de la API", () => {
    const consulta = aConsulta({ ...FILTROS_INICIALES, categoria: "CANCHAS", soloImportantes: true, orden: "ANTIGUOS", pagina: 3 });

    expect(consulta.toString()).toBe("categoria=CANCHAS&soloImportantes=true&orden=ANTIGUOS&pagina=3&porPagina=25");
  });
});

describe("hayFiltros", () => {
  it("dice si algo distinto del orden y la página está filtrando", () => {
    expect(hayFiltros(FILTROS_INICIALES)).toBe(false);
    expect(hayFiltros({ ...FILTROS_INICIALES, orden: "ANTIGUOS", pagina: 4 })).toBe(false);
    expect(hayFiltros({ ...FILTROS_INICIALES, desde: "2026-11-01" })).toBe(true);
  });
});

describe("atajos de período", () => {
  it.each([
    ["HOY", { desde: "2026-11-24", hasta: "2026-11-24" }],
    ["AYER", { desde: "2026-11-23", hasta: "2026-11-23" }],
    ["SIETE_DIAS", { desde: "2026-11-18", hasta: "2026-11-24" }],
    ["TREINTA_DIAS", { desde: "2026-10-26", hasta: "2026-11-24" }],
    ["TODO", { desde: "", hasta: "" }],
  ] as const)("%s cuenta días de Lima incluyendo hoy", (periodo, rango) => {
    expect(rangoDelPeriodo(periodo, "2026-11-24")).toEqual(rango);
    expect(periodoDe(rango, "2026-11-24")).toBe(periodo);
  });

  it("unas fechas elegidas a mano no corresponden a ningún atajo", () => {
    expect(periodoDe({ desde: "2026-11-02", hasta: "2026-11-10" }, "2026-11-24")).toBeUndefined();
  });
});
