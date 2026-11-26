import { describe, expect, it } from "vitest";
import { reglasDeDatosPersonales } from "./reglas-de-datos-personales";

describe("reglasDeDatosPersonales", () => {
  it("habla en segunda persona a quien llena sus propios datos", () => {
    const reglas = reglasDeDatosPersonales("propia");

    expect(reglas.nombres("")).toBe("Ingresa tus nombres.");
    expect(reglas.fechaNacimiento("2015-01-01")).toBe("Debes tener al menos 18 años para crear tu cuenta.");
    expect(reglas.documento("DNI", "")).toBe("Ingresa tu número de documento.");
  });

  it("habla de la otra persona cuando el personal llena sus datos", () => {
    const reglas = reglasDeDatosPersonales("ajena");

    expect(reglas.nombres("")).toBe("Ingresa los nombres.");
    expect(reglas.fechaNacimiento("2015-01-01")).toBe("Debe tener al menos 18 años.");
    expect(reglas.celular("")).toBe("Ingresa el número de celular.");
  });

  it("aplica las mismas reglas de formato en las dos voces", () => {
    for (const voz of ["propia", "ajena"] as const) {
      expect(reglasDeDatosPersonales(voz).documento("DNI", "1234")).toBe("El DNI debe tener 8 dígitos.");
      expect(reglasDeDatosPersonales(voz).celular("812345678")).toBe("El celular debe empezar con 9.");
    }
  });
});
