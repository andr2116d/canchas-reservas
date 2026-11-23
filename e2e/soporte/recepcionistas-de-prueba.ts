import { randomInt } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { crearAdministradorDePrueba, DOMINIO_DE_PRUEBA } from "./personal-de-prueba";

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

export async function iniciarSesion(pagina: Page, correo: string, contrasena: string) {
  await pagina.goto("/iniciar-sesion");
  await pagina.getByLabel("Correo").fill(correo);
  await pagina.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await pagina.getByRole("button", { name: "Iniciar sesión" }).click();
}

/** Entra como un administrador nuevo y deja el cambio de su contraseña temporal para después. */
export async function entrarComoAdministrador(pagina: Page) {
  const admin = crearAdministradorDePrueba();
  await iniciarSesion(pagina, admin.correo, admin.contrasena);
  // Con varias pruebas en paralelo, verificar la contraseña (argon2) puede tardar más de 5 s.
  await expect(pagina).toHaveURL("/cambiar-contrasena", { timeout: 20_000 });
  await pagina.getByRole("button", { name: "Ahora no" }).click();
  await expect(pagina).toHaveURL("/administracion", { timeout: 20_000 });
}

/** Crea la recepcionista con la sesión del administrador abierta en la página y devuelve su id. */
export async function crearPorApi(pagina: Page, recepcionista = unaRecepcionistaNueva()) {
  const respuesta = await pagina.request.post("/api/recepcionistas", { data: recepcionista });
  expect(respuesta.status()).toBe(201);
  return { ...recepcionista, id: ((await respuesta.json()) as { id: number }).id };
}

export async function cerrarSesion(pagina: Page) {
  await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(pagina).toHaveURL("/iniciar-sesion");
}
