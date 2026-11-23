import { describe, expect, it } from "vitest";
import { datosParaEntregar } from "./datos-para-entregar";

describe("datosParaEntregar", () => {
  it("reúne lo que la recepcionista necesita para entrar", () => {
    expect(
      datosParaEntregar({ correo: "rosa.quispe@laprevia.pe", contrasena: "Adq2V25XmA", sitio: "https://laprevia.pe" }),
    ).toBe(
      [
        "Tu acceso a La Previa",
        "Entra en: https://laprevia.pe/iniciar-sesion",
        "Correo: rosa.quispe@laprevia.pe",
        "Contraseña temporal: Adq2V25XmA",
        "Vence en 7 días. Al entrar se te pedirá cambiarla.",
      ].join("\n"),
    );
  });
});
