import { describe, expect, it } from "vitest";
import { esquemaDeAdicional } from "./adicional.schema";

const errores = (cambios: Record<string, string>) => {
  const resultado = esquemaDeAdicional.safeParse({ nombre: "Balón", descripcion: "", precio: "45", ...cambios });
  if (resultado.success) return {};
  return Object.fromEntries(resultado.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe("esquemaDeAdicional", () => {
  it("acepta nombre y precio, con la descripción vacía", () => {
    expect(errores({})).toEqual({});
  });

  it.each([
    [{ nombre: "  " }, { nombre: "Escribe el nombre del adicional." }],
    [{ nombre: "x".repeat(41) }, { nombre: "Usa como máximo 40 caracteres." }],
    [{ precio: "0" }, { precio: "El monto debe ser mayor que cero." }],
    [{ precio: "" }, { precio: "Ingresa el monto." }],
    [{ descripcion: "x".repeat(201) }, { descripcion: "Usa como máximo 200 caracteres." }],
  ])("rechaza %o", (cambios, esperado) => {
    expect(errores(cambios)).toEqual(esperado);
  });
});
