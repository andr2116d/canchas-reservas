import { randomInt } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { DOMINIO_DE_PRUEBA } from "./personal-de-prueba";

const LETRAS = "abcdefghijklmnopqrstuvwxyz";

/** Apellido inventado y único, para que el correo generado no choque con otras pruebas. */
function apellidoUnico(): string {
  const letras = Array.from({ length: 8 }, () => LETRAS[randomInt(LETRAS.length)]).join("");
  return "Q" + letras;
}

export function unaRecepcionistaNueva() {
  const apellido = apellidoUnico();
  return {
    nombres: "Rosa",
    apellidos: `${apellido} Lozano`,
    fechaNacimiento: "1995-02-01",
    tipoDocumento: "DNI",
    numeroDocumento: String(randomInt(10_000_000, 99_999_999)),
    celular: `9${randomInt(10_000_000, 99_999_999)}`,
    usuarioDeCorreo: `rosa.${apellido.toLowerCase()}`,
    contrasena: "temporal2026",
  };
}

export type RecepcionistaDePrueba = ReturnType<typeof unaRecepcionistaNueva>;

export const correoDe = (recepcionista: RecepcionistaDePrueba) =>
  `${recepcionista.usuarioDeCorreo}@${DOMINIO_DE_PRUEBA}`;

/** Crea la recepcionista con la sesión del administrador abierta en la página y devuelve su id. */
export async function crearPorApi(pagina: Page, recepcionista = unaRecepcionistaNueva()) {
  const respuesta = await pagina.request.post("/api/recepcionistas", { data: recepcionista });
  expect(respuesta.status()).toBe(201);
  return { ...recepcionista, id: ((await respuesta.json()) as { id: number }).id };
}
