import { expect, type Page } from "@playwright/test";
import { crearAdministradorDePrueba } from "./personal-de-prueba";

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

export async function cerrarSesion(pagina: Page) {
  await pagina.getByRole("button", { name: "Mi cuenta" }).click();
  await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(pagina).toHaveURL("/iniciar-sesion");
}
