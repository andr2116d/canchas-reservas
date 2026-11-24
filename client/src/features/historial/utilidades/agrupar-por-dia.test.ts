import { describe, expect, it } from "vitest";
import { agruparPorDia } from "./agrupar-por-dia";

const en = (ocurridoEn: string) => ({ id: ocurridoEn, ocurridoEn });

describe("agruparPorDia", () => {
  it("agrupa por día de Lima y nombra hoy y ayer", () => {
    const grupos = agruparPorDia(
      [en("2026-11-24T15:00:00.000Z"), en("2026-11-24T04:30:00.000Z"), en("2026-11-23T20:00:00.000Z"), en("2026-11-20T20:00:00.000Z")],
      "2026-11-24",
    );

    expect(grupos.map((g) => [g.titulo, g.registros.length])).toEqual([
      ["Hoy", 1],
      ["Ayer", 2],
      ["vie 20 nov 2026", 1],
    ]);
  });
});
