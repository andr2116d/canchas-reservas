import { describe, expect, it } from "vitest";
import { erroresDeCancha } from "./cancha.schema";

describe("erroresDeCancha", () => {
  it("no marca nada si el nombre, el tamaño y la luz están", () => {
    expect(erroresDeCancha({ nombre: "Cancha 1", tipo: "FUTBOL_5", tieneIluminacion: false })).toEqual({});
  });

  it("dice qué falta: nombre, tamaño o luz", () => {
    expect(erroresDeCancha({ nombre: "  ", tipo: null, tieneIluminacion: null })).toEqual({
      nombre: "Escribe el nombre de la cancha.",
      tipo: "Elige si es de fútbol 5 o de fútbol 7.",
      tieneIluminacion: "Indica si tiene luz para jugar de noche.",
    });
  });

  it("limita el nombre a 40 caracteres", () => {
    expect(erroresDeCancha({ nombre: "a".repeat(41), tipo: "FUTBOL_7", tieneIluminacion: true })).toEqual({
      nombre: "Usa como máximo 40 caracteres.",
    });
  });
});
