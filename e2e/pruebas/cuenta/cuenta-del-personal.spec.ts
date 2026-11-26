import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { crearAdministradorDePrueba, DOMINIO_DE_PRUEBA } from "../../soporte/personal-de-prueba";
import { correoDe, crearPorApi } from "../../soporte/recepcionistas-de-prueba";
import {
  cerrarSesion,
  datosDeUnAdministrador,
  entrarComoAdministrador,
  iniciarSesion,
} from "../../soporte/sesiones-de-prueba";

test("el administrador completa sus datos en su primer ingreso y después elige su contraseña", async ({ page }) => {
  const admin = crearAdministradorDePrueba();
  const datos = datosDeUnAdministrador();
  await iniciarSesion(page, admin.correo, admin.contrasena);
  await expect(page).toHaveURL("/completar-datos", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Completa tus datos" })).toBeVisible();
  await page.goto("/administracion");
  await expect(page).toHaveURL("/completar-datos");

  await page.getByLabel(/^Fecha de nacimiento/).fill(datos.fechaNacimiento);
  await page.getByLabel(/^Celular/).pressSequentially(datos.celular);
  await page.getByLabel(/^Número de documento/).pressSequentially(datos.numeroDocumento);
  await expect(page.getByRole("link", { name: "aviso de privacidad del personal" })).toBeVisible();
  await page.getByRole("button", { name: "Guardar mis datos" }).click();

  await expect(page).toHaveURL("/cambiar-contrasena");
  await page.getByLabel("Nueva contraseña").fill("definitiva2026");
  await page.getByLabel("Confirma la contraseña").fill("definitiva2026");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page).toHaveURL("/administracion");
  await page.goto("/completar-datos");
  await expect(page).toHaveURL("/administracion");
});

test("la recepcionista confirma los datos que cargó administración, sin poder cambiar su documento", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await cerrarSesion(page);

  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await expect(page).toHaveURL("/completar-datos", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Confirma tus datos" })).toBeVisible();
  await expect(page.getByLabel(/^Apellidos/)).toHaveValue(recepcionista.apellidos);
  await expect(page.getByText(`DNI ${recepcionista.numeroDocumento}`)).toBeVisible();
  await expect(page.getByLabel(/^Número de documento/)).toHaveCount(0);
  await page.getByLabel(/^Nombres/).fill("Rosa Elena");
  await page.getByRole("button", { name: "Mis datos son correctos" }).click();

  await expect(page).toHaveURL("/cambiar-contrasena");
  await page.getByRole("button", { name: "Ahora no" }).click();
  await page.goto("/recepcion/cuenta");
  await expect(page.getByLabel(/^Nombres/)).toHaveValue("Rosa Elena");
});

test("el administrador cambia su correo institucional y entra con el nuevo", async ({ page }) => {
  await entrarComoAdministrador(page);
  const usuario = "direccion." + randomUUID().slice(0, 8);
  await page.goto("/administracion/cuenta");

  const correo = page.getByLabel(/^Correo de La Previa/);
  await expect(page.getByText(`siempre termina en @${DOMINIO_DE_PRUEBA}`)).toBeVisible();
  await correo.fill(usuario);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();

  await cerrarSesion(page);
  await iniciarSesion(page, `${usuario}@${DOMINIO_DE_PRUEBA}`, "temporal2026");
  await expect(page).toHaveURL("/cambiar-contrasena", { timeout: 20_000 });
});

test("el tipo de documento se cambia una sola vez, tras leer el aviso", async ({ page }) => {
  await entrarComoAdministrador(page);
  await page.goto("/administracion/cuenta");

  await page.getByRole("button", { name: "Cambiar a carné de extranjería" }).click();
  const tarjeta = page.getByRole("dialog", { name: "Cambiar a carné de extranjería" });
  await expect(tarjeta).toContainText("Se hace una sola vez");
  await tarjeta.getByLabel(/^Número de carné/).fill(`C${randomUUID().replace(/-/g, "").slice(0, 10)}`.toUpperCase());
  await expect(tarjeta.getByRole("button", { name: "Cambiar mi documento" })).toBeDisabled();
  await tarjeta.getByLabel("Leí el aviso y mi documento cambió.").check();
  await tarjeta.getByRole("button", { name: "Cambiar mi documento" }).click();

  await expect(page.getByText("Tu documento ahora es carné de extranjería.")).toBeVisible();
  await expect(page.getByText(/^Carné de extranjería /)).toBeVisible();
  await expect(page.getByRole("button", { name: "Cambiar a DNI" })).toHaveCount(0);
});

test("desde Seguridad se cierran las demás sesiones abiertas", async ({ page, browser }) => {
  const admin = await entrarComoAdministrador(page);
  const otroNavegador = await browser.newContext();
  const otra = await otroNavegador.newPage();
  await iniciarSesion(otra, admin.correo, admin.contrasena);
  await expect(otra).toHaveURL("/cambiar-contrasena", { timeout: 20_000 });

  await page.goto("/administracion/cuenta");
  await page.getByRole("tab", { name: "Seguridad" }).click();
  await expect(page.getByRole("list", { name: "Sesiones abiertas" }).getByRole("listitem")).toHaveCount(2);
  await page.getByRole("button", { name: "Cerrar las demás" }).click();

  await expect(page.getByText("Cerramos tu otra sesión.")).toBeVisible();
  const rechazo = await otra.request.get("/api/cuenta");
  expect(rechazo.status()).toBe(401);
  await otroNavegador.close();
});
