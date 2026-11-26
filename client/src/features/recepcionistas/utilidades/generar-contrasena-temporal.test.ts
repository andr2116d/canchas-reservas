import { describe, expect, it } from "vitest";
import { reglaDeContrasena } from "@/compartido/formulario/reglas-de-datos-personales";
import { generarContrasenaTemporal } from "./generar-contrasena-temporal";

describe("generarContrasenaTemporal", () => {
  it("cumple la regla de contraseña de La Previa", () => {
    for (let vez = 0; vez < 50; vez++) {
      expect(reglaDeContrasena(generarContrasenaTemporal())).toBeUndefined();
    }
  });

  it("no usa caracteres que se confunden al dictarla", () => {
    for (let vez = 0; vez < 50; vez++) {
      expect(generarContrasenaTemporal()).not.toMatch(/[0O1lI]/);
    }
  });

  it("genera una distinta cada vez", () => {
    expect(generarContrasenaTemporal()).not.toBe(generarContrasenaTemporal());
  });
});
