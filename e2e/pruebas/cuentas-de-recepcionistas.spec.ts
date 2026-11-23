import { expect, test } from "@playwright/test";
import {
  cerrarSesion,
  correoDe,
  crearPorApi,
  entrarComoAdministrador,
  iniciarSesion,
} from "../soporte/recepcionistas-de-prueba";

test("una cuenta desactivada no inicia sesión y pasa al listado de desactivadas", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  const nombre = `Rosa ${recepcionista.apellidos}`;
  await page.goto(`/administracion/recepcionistas/${recepcionista.id}`);

  await page.getByRole("button", { name: "Desactivar cuenta" }).click();
  await page.getByRole("button", { name: "Sí, desactivar" }).click();

  await expect(page.getByText("Desactivada", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Historial" })).toContainText("Desactivación");
  await page.goto("/administracion/recepcionistas");
  await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);
  await page.getByRole("link", { name: "Desactivadas" }).click();
  await expect(page.getByRole("link", { name: nombre })).toBeVisible();
  await cerrarSesion(page);
  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("inactiva");
  await expect(page).toHaveURL("/iniciar-sesion");
});

test("el administrador edita sus datos y restablece su contraseña", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await page.goto(`/administracion/recepcionistas/${recepcionista.id}`);

  await page.getByLabel(/^Celular/).fill("");
  await page.getByLabel(/^Celular/).pressSequentially("987000111");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  await page.getByRole("button", { name: "Generar contraseña" }).click();
  const nueva = await page.getByLabel(/^Contraseña temporal/).inputValue();
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(page.getByText(nueva)).toBeVisible();

  const historial = page.getByRole("region", { name: "Historial" }).getByRole("listitem");
  await expect(historial).toHaveText([/Restablecimiento de contraseña/, /Edición de datos/, /Alta de la cuenta/]);
  await cerrarSesion(page);
  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("incorrectos");
  await iniciarSesion(page, correoDe(recepcionista), nueva);
  await expect(page).toHaveURL("/cambiar-contrasena");
});

test("solo el administrador entra a la gestión de recepcionistas", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await cerrarSesion(page);
  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page).toHaveURL("/recepcion");

  await page.goto("/administracion/recepcionistas");

  await expect(page).toHaveURL("/acceso-no-autorizado");
  const respuesta = await page.request.get("/api/recepcionistas?estado=activas");
  expect(respuesta.status()).toBe(403);
});
