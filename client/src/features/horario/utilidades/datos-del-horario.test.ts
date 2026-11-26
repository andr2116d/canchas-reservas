import { describe, expect, it } from "vitest";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { datosParaGuardar, semanaDelFormulario, ubicarErrores, valoresDelFormulario } from "./datos-del-horario";

const SIN_HORARIO: HorarioConsultado = { historial: [], inicioDeLaNochePorDefecto: "18:00" };

function conHorario(): HorarioConsultado {
  const abierto = (dia: string, abre = "08:00", cierra = "22:00", noche?: string) => ({
    dia,
    abierto: true,
    abre,
    cierra,
    ...(noche && { inicioDeLaNoche: noche }),
  });
  const vigente = {
    inicioDeLaNoche: "18:00",
    dias: [
      abierto("LUNES"),
      abierto("MARTES"),
      abierto("MIERCOLES"),
      abierto("JUEVES"),
      abierto("VIERNES", "08:00", "23:00"),
      abierto("SABADO", "08:00", "22:00", "17:00"),
      { dia: "DOMINGO", abierto: false },
    ],
    guardadoEn: "2026-11-23T01:30:00.000Z",
    guardadoPor: "Valeria León",
  } as HorarioConsultado["vigente"] & object;
  return { vigente, historial: [vigente], inicioDeLaNochePorDefecto: "18:00" };
}

describe("datos del horario", () => {
  it("sin horario guardado propone abrir todos los días de 08:00 a 22:00, sin días distintos", () => {
    expect(valoresDelFormulario(SIN_HORARIO)).toEqual({
      abre: "08:00",
      cierra: "22:00",
      inicioDeLaNoche: "18:00",
      abiertos: ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"],
      distintos: [],
    });
  });

  it("toma como general el horario más repetido y deja como distintos los demás días", () => {
    const valores = valoresDelFormulario(conHorario());

    expect(valores).toMatchObject({ abre: "08:00", cierra: "22:00", inicioDeLaNoche: "18:00" });
    expect(valores.abiertos).not.toContain("DOMINGO");
    expect(valores.distintos).toEqual([
      { dia: "VIERNES", abre: "08:00", cierra: "23:00", inicioDeLaNoche: "18:00" },
      { dia: "SABADO", abre: "08:00", cierra: "22:00", inicioDeLaNoche: "17:00" },
    ]);
  });

  it("envía cada día con su horario, sin horas si está cerrado y con noche propia solo si cambia", () => {
    const { dias } = datosParaGuardar(valoresDelFormulario(conHorario()));

    expect(dias[0]).toEqual({ dia: "LUNES", abierto: true, abre: "08:00", cierra: "22:00" });
    expect(dias[4]).toEqual({ dia: "VIERNES", abierto: true, abre: "08:00", cierra: "23:00" });
    expect(dias[5]).toEqual({ dia: "SABADO", abierto: true, abre: "08:00", cierra: "22:00", inicioDeLaNoche: "17:00" });
    expect(dias[6]).toEqual({ dia: "DOMINGO", abierto: false });
  });

  it("arma la semana en borrador con la noche resuelta de cada día", () => {
    const semana = semanaDelFormulario(valoresDelFormulario(conHorario()));

    expect(semana.LUNES).toEqual({ abre: "08:00", cierra: "22:00", inicioDeLaNoche: "18:00" });
    expect(semana.SABADO?.inicioDeLaNoche).toBe("17:00");
    expect(semana.DOMINGO).toBeUndefined();
  });

  it("ubica los errores del server en el día distinto o en el horario general", () => {
    const valores = valoresDelFormulario(conHorario());

    expect(ubicarErrores({ "VIERNES.cierra": "Mal.", "LUNES.abre": "Otra.", dias: "Faltan." }, valores)).toEqual({
      "distintos.0.cierra": "Mal.",
      abre: "Otra.",
      dias: "Faltan.",
    });
  });
});
