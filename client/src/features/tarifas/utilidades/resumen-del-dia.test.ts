import { describe, expect, it } from "vitest";
import { resumenDelDia } from "./resumen-del-dia";

const LUNES = { dia: "LUNES" as const, abierto: true, abre: "08:00", cierra: "22:00" };

describe("resumenDelDia", () => {
  it("cuenta los turnos completos y el rato sin turno, como el server", () => {
    expect(resumenDelDia(LUNES, 180, false)).toEqual({ turnos: 4, sinTurno: { desde: "20:00", hasta: "22:00" } });
    expect(resumenDelDia(LUNES, 60, false)).toEqual({ turnos: 14 });
  });

  it("ofrece el turno corto solo si se permite y dura al menos 30 minutos", () => {
    expect(resumenDelDia(LUNES, 180, true)).toEqual({ turnos: 4, corto: { desde: "20:00", hasta: "22:00" } });
    expect(resumenDelDia({ ...LUNES, cierra: "20:20" }, 180, true)).toEqual({
      turnos: 4,
      sinTurno: { desde: "20:00", hasta: "20:20" },
    });
  });

  it("un día cerrado no tiene turnos", () => {
    expect(resumenDelDia({ dia: "DOMINGO", abierto: false }, 60, false)).toBeUndefined();
  });
});
