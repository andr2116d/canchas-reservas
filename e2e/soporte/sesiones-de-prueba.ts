import { randomInt } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { crearAdministradorDePrueba } from "./personal-de-prueba";

export async function iniciarSesion(pagina: Page, correo: string, contrasena: string) {
  await pagina.goto("/iniciar-sesion");
  await pagina.getByLabel("Correo").fill(correo);
  await pagina.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await pagina.getByRole("button", { name: "Iniciar sesión" }).click();
}

/** Datos válidos y únicos del administrador para su primer ingreso. */
export function datosDeUnAdministrador() {
  return {
    nombres: "Valeria",
    apellidos: "León Paredes",
    fechaNacimiento: "1990-03-02",
    celular: `9${randomInt(10_000_000, 99_999_999)}`,
    tipoDocumento: "DNI",
    numeroDocumento: String(randomInt(10_000_000, 99_999_999)),
  };
}

/** Completa por la API los datos del administrador con la sesión abierta en la página. */
export async function completarDatosDelAdministrador(pagina: Page) {
  const respuesta = await pagina.request.post("/api/cuenta/datos", { data: datosDeUnAdministrador() });
  expect(respuesta.status()).toBe(204);
}

/** Primer ingreso de una recepcionista: confirma lo que cargó administración y sigue a la contraseña. */
export async function confirmarMisDatos(pagina: Page) {
  await expect(pagina).toHaveURL("/completar-datos", { timeout: 20_000 });
  await pagina.getByRole("button", { name: "Mis datos son correctos" }).click();
  await expect(pagina).toHaveURL("/cambiar-contrasena", { timeout: 20_000 });
}

/** Entra como un administrador nuevo con sus datos completos y deja el cambio de contraseña para después. */
export async function entrarComoAdministrador(pagina: Page) {
  const admin = crearAdministradorDePrueba();
  await iniciarSesion(pagina, admin.correo, admin.contrasena);
  // Con varias pruebas en paralelo, verificar la contraseña (argon2) puede tardar más de 5 s.
  await expect(pagina).toHaveURL("/completar-datos", { timeout: 20_000 });
  await completarDatosDelAdministrador(pagina);
  await pagina.goto("/cambiar-contrasena");
  await pagina.getByRole("button", { name: "Ahora no" }).click();
  await expect(pagina).toHaveURL("/administracion", { timeout: 20_000 });
  return admin;
}

export async function cerrarSesion(pagina: Page) {
  await pagina.getByRole("button", { name: "Mi cuenta" }).click();
  await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(pagina).toHaveURL("/iniciar-sesion");
}
