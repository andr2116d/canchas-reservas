import { randomInt, randomUUID } from "node:crypto";

/** Datos válidos y únicos para cada prueba, así ninguna choca con otra. */
export function unJugadorNuevo() {
  return {
    nombres: "Valeria",
    apellidos: "León Paredes",
    numeroDocumento: String(randomInt(10_000_000, 99_999_999)),
    celular: `9${randomInt(10_000_000, 99_999_999)}`,
    correo: `jugador.${randomUUID()}@prueba.pe`,
    contrasena: "pichanga10",
  };
}

export type JugadorDePrueba = ReturnType<typeof unJugadorNuevo>;
