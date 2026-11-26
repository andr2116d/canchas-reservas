import { describe, expect, it } from "vitest";
import { reglaDeUsuarioDeCorreo } from "./regla-de-usuario-de-correo";

describe("reglaDeUsuarioDeCorreo", () => {
  const regla = reglaDeUsuarioDeCorreo("Escribe tu correo.");

  it("acepta lo que va antes de la @", () => {
    expect(regla("valeria.leon")).toBeUndefined();
  });

  it.each([
    ["", "Escribe tu correo."],
    ["valeria@laprevia.pe", "Escribe solo lo que va antes de la @, sin espacios."],
    ["x".repeat(65), "El correo no puede tener más de 64 caracteres antes de la @."],
  ])("rechaza «%s»", (valor, mensaje) => {
    expect(regla(valor)).toBe(mensaje);
  });
});
