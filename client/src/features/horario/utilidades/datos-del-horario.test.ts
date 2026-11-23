import { describe, expect, it } from "vitest";
import { datosParaGuardar, erroresDelFormulario, valoresDelFormulario } from "./datos-del-horario";

describe("datos del horario", () => {
  it("sin horario guardado propone abrir todos los días de 08:00 a 22:00", () => {
    const valores = valoresDelFormulario({ historial: [], inicioDeLaNochePorDefecto: "18:00" });

    expect(valores.inicioDeLaNoche).toBe("18:00");
    expect(valores.dias).toHaveLength(7);
    expect(valores.dias[0]).toEqual({
      dia: "LUNES",
      abierto: true,
      abre: "08:00",
      cierra: "22:00",
      nochePropia: false,
      inicioDeLaNoche: "18:00",
    });
  });

  it("envía los días cerrados sin horas y la noche propia solo si se eligió", () => {
    const valores = valoresDelFormulario({ historial: [], inicioDeLaNochePorDefecto: "18:00" });
    valores.dias[5] = { ...valores.dias[5], nochePropia: true, inicioDeLaNoche: "17:00" };
    valores.dias[6] = { ...valores.dias[6], abierto: false };

    const { dias } = datosParaGuardar(valores);

    expect(dias[0]).toEqual({ dia: "LUNES", abierto: true, abre: "08:00", cierra: "22:00" });
    expect(dias[5]).toMatchObject({ dia: "SABADO", inicioDeLaNoche: "17:00" });
    expect(dias[6]).toEqual({ dia: "DOMINGO", abierto: false });
  });

  it("ubica los errores del server en el día que corresponde", () => {
    expect(erroresDelFormulario({ "MARTES.cierra": "Mal.", inicioDeLaNoche: "Otra." })).toEqual({
      "dias.1.cierra": "Mal.",
      inicioDeLaNoche: "Otra.",
    });
  });
});
