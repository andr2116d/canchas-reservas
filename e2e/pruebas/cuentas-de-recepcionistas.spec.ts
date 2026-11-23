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

  await expect(page.getByText("Cuenta desactivada", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Historial" })).toContainText("Desactivación");
  await page.goto("/administracion/recepcionistas");
  await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);
  await page.getByRole("link", { name: "Cuentas desactivadas" }).click();
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

test("desde el listado se restablece la contraseña y se desactiva sin entrar a la ficha", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  const nombre = `Rosa ${recepcionista.apellidos}`;
  await page.goto("/administracion/recepcionistas");

  await page.getByRole("button", { name: `Restablecer la contraseña de ${nombre}` }).click();
  const tarjeta = page.getByRole("dialog", { name: "Restablecer contraseña" });
  await tarjeta.getByRole("button", { name: "Generar contraseña" }).click();
  await tarjeta.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(tarjeta.getByText(/Entrégale la nueva contraseña temporal/)).toBeVisible();
  await expect(tarjeta.getByRole("button", { name: "Copiar datos" })).toBeVisible();
  await tarjeta.getByRole("button", { name: "Cerrar" }).click();

  await page.getByRole("button", { name: `Desactivar a ${nombre}` }).click();
  await page.getByRole("dialog", { name: "Desactivar cuenta" }).getByRole("button", { name: "Sí, desactivar" }).click();
  await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);
  await page.getByRole("link", { name: "Cuentas desactivadas" }).click();
  await expect(page.getByRole("link", { name: nombre })).toBeVisible();
});

test("pulsar en cualquier parte de la tarjeta abre la ficha", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await page.goto("/administracion/recepcionistas");

  // Se pulsa sobre la tarjeta, a la altura del correo: no es un enlace, pero la tarjeta entera lo es.
  await page.getByRole("listitem").filter({ hasText: correoDe(recepcionista) }).click({ position: { x: 40, y: 55 } });

  await expect(page).toHaveURL(`/administracion/recepcionistas/${recepcionista.id}`);
});

test("la recepcionista lee el aviso de privacidad del personal desde su panel", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await cerrarSesion(page);
  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page).toHaveURL("/recepcion");

  await page.getByRole("link", { name: "aviso de privacidad del personal" }).click();

  await expect(page).toHaveURL("/legal/privacidad-del-personal");
  await expect(page.getByRole("heading", { name: "Aviso de privacidad del personal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tus derechos" })).toBeVisible();
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
