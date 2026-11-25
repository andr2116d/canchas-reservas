import { describe, expect, it } from "vitest";
import type { DiaDelClub } from "../servicios/club";
import { agruparHorario } from "./horario-agrupado";

const dia = (d: DiaDelClub["dia"], abre = "08:00", cierra = "23:00"): DiaDelClub => ({ dia: d, abre, cierra, inicioDeLaNoche: "18:00" });

describe("agruparHorario", () => {
  it("junta los días seguidos con el mismo horario", () => {
    const dias = (["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"] as const).map((d) => dia(d));

    expect(agruparHorario([...dias, dia("DOMINGO", "08:00", "22:00")])).toEqual([
      { dias: "Lunes a sábado", horas: "08:00 – 23:00" },
      { dias: "Domingo", horas: "08:00 – 22:00" },
    ]);
  });

  it("dice qué días está cerrado y usa «y» para dos días seguidos", () => {
    expect(agruparHorario([dia("SABADO"), dia("DOMINGO")])).toEqual([
      { dias: "Lunes a viernes", horas: "Cerrado" },
      { dias: "Sábado y domingo", horas: "08:00 – 23:00" },
    ]);
  });
});
