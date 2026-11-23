import { describe, expect, it } from "vitest";
import { calcularTurnos } from "./turnos";

const LUNES = { abre: "08:00", cierra: "22:00", inicioDeLaNoche: "18:00" };
const FUTBOL_7 = { precioDia: "50", precioNoche: "100", horas: 3, ofreceTurnoCorto: false };

describe("calcularTurnos", () => {
  it("da los turnos seguidos con su precio, como el server", () => {
    const { turnos, sinTurno } = calcularTurnos(LUNES, FUTBOL_7);

    expect(turnos.map((turno) => `${turno.desde}-${turno.hasta} ${turno.total}`)).toEqual([
      "08:00-11:00 50.00",
      "11:00-14:00 50.00",
      "14:00-17:00 50.00",
      "17:00-20:00 83.33",
    ]);
    expect(turnos[3].partes).toEqual({ dia: "16.67", noche: "66.66" });
    expect(sinTurno).toEqual({ desde: "20:00", hasta: "22:00" });
  });

  it("ofrece el rato final como turno corto cobrado en proporción", () => {
    const { turnos, sinTurno } = calcularTurnos(LUNES, { ...FUTBOL_7, ofreceTurnoCorto: true });

    expect(turnos.at(-1)).toEqual({ desde: "20:00", hasta: "22:00", corto: true, total: "66.67" });
    expect(sinTurno).toBeUndefined();
  });

  it("nunca ofrece un rato de menos de 30 minutos", () => {
    const { turnos, sinTurno } = calcularTurnos({ ...LUNES, cierra: "20:20" }, { ...FUTBOL_7, ofreceTurnoCorto: true });

    expect(turnos).toHaveLength(4);
    expect(sinTurno).toEqual({ desde: "20:00", hasta: "20:20" });
  });

  it("con turnos de una hora de 08:00 a 22:00 salen 14 turnos", () => {
    expect(calcularTurnos(LUNES, { ...FUTBOL_7, horas: 1 }).turnos).toHaveLength(14);
  });
});
