import { type APIRequestContext, expect } from "@playwright/test";
import { randomInt, randomUUID } from "node:crypto";

/** Fecha de los términos y la privacidad publicados que acepta quien se registra. */
export const VERSION_LEGAL_DEL_REGISTRO = "2026-11-24";

/** Datos válidos y únicos para cada prueba, así ninguna choca con otra. */
export function unJugadorNuevo() {
  return {
    nombres: "Valeria",
    apellidos: "León Paredes",
    fechaNacimiento: "1998-05-14",
    numeroDocumento: String(randomInt(10_000_000, 99_999_999)),
    celular: `9${randomInt(10_000_000, 99_999_999)}`,
    correo: `jugador.${randomUUID()}@prueba.pe`,
    contrasena: "pichanga10",
  };
}

export type JugadorDePrueba = ReturnType<typeof unJugadorNuevo>;

/** Registra un jugador por la API; el contexto de `request` queda con su sesión abierta. */
export async function registrarPorApi(request: APIRequestContext, jugador: JugadorDePrueba = unJugadorNuevo()) {
  const respuesta = await request.post("/api/jugadores", { data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: VERSION_LEGAL_DEL_REGISTRO } });
  expect(respuesta.status()).toBe(201);
  return jugador;
}
