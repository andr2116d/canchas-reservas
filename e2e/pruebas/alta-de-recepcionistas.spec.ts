import { expect, test, type Page } from "@playwright/test";
import {
  cerrarSesion,
  correoDe,
  crearPorApi,
  entrarComoAdministrador,
  iniciarSesion,
  unaRecepcionistaNueva,
  type RecepcionistaDePrueba,
} from "../soporte/recepcionistas-de-prueba";

async function llenarDatos(pagina: Page, recepcionista: RecepcionistaDePrueba) {
  await pagina.goto("/administracion/recepcionistas/nueva");
  await pagina.getByLabel(/^Nombres/).fill(recepcionista.nombres);
  await pagina.getByLabel(/^Apellidos/).fill(recepcionista.apellidos);
  await pagina.getByLabel(/^Fecha de nacimiento/).fill(recepcionista.fechaNacimiento);
  await pagina.getByLabel(/^Número de documento/).pressSequentially(recepcionista.numeroDocumento);
  await pagina.getByLabel(/^Celular/).pressSequentially(recepcionista.celular);
}

test("el administrador crea una recepcionista con correo y contraseña generados", async ({ page }) => {
  const recepcionista = unaRecepcionistaNueva();
  await entrarComoAdministrador(page);
  await page.getByRole("link", { name: "Recepcionistas" }).first().click();
  await page.getByRole("link", { name: "Nueva recepcionista" }).click();
  await llenarDatos(page, recepcionista);

  await page.getByRole("button", { name: "Generar correo" }).click();
  await expect(page.getByLabel(/^Correo institucional/)).toHaveValue(recepcionista.usuarioDeCorreo);
  await page.getByRole("button", { name: "Generar contraseña" }).click();
  const temporal = await page.getByLabel(/^Contraseña temporal/).inputValue();
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByRole("heading", { name: "Cuenta creada" })).toBeVisible();
  await expect(page.getByText(correoDe(recepcionista))).toBeVisible();
  await expect(page.getByText(temporal)).toBeVisible();
  await page.getByRole("link", { name: "Ver su ficha" }).click();
  await expect(page.getByRole("heading", { name: `Rosa ${recepcionista.apellidos}` })).toBeVisible();
  await expect(page.getByText("Alta de la cuenta")).toBeVisible();
});

test("rechaza el alta con el documento y el correo de una recepcionista activa", async ({ page }) => {
  await entrarComoAdministrador(page);
  const existente = await crearPorApi(page);
  await llenarDatos(page, existente);
  await page.getByLabel(/^Correo institucional/).fill(existente.usuarioDeCorreo);
  await page.getByLabel(/^Contraseña temporal/).fill("temporal2026");

  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Este documento ya tiene una cuenta de recepción activa.")).toBeVisible();
  await expect(page.getByText("Este correo ya fue registrado para otra cuenta del personal.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cuenta creada" })).toHaveCount(0);
});

test("con los datos de una cuenta desactivada ofrece reactivarla y conserva su historial", async ({ page }) => {
  await entrarComoAdministrador(page);
  const anterior = await crearPorApi(page);
  await page.request.post(`/api/recepcionistas/${anterior.id}/desactivacion`);
  await llenarDatos(page, anterior);
  await page.getByLabel(/^Correo institucional/).fill(anterior.usuarioDeCorreo);
  await page.getByLabel(/^Contraseña temporal/).fill("regreso2026");

  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Rosa ya tuvo una cuenta de recepción");
  await page.getByRole("button", { name: "Reactivar su cuenta" }).click();

  await expect(page).toHaveURL(`/administracion/recepcionistas/${anterior.id}`);
  await expect(page.getByText("Activa", { exact: true })).toBeVisible();
  const historial = page.getByRole("region", { name: "Historial" }).getByRole("listitem");
  await expect(historial).toHaveText([/Reactivación/, /Desactivación/, /Alta de la cuenta/]);
  await cerrarSesion(page);
  await iniciarSesion(page, correoDe(anterior), "regreso2026");
  await expect(page).toHaveURL("/cambiar-contrasena");
});

test("la recepcionista puede dejar el cambio de su contraseña temporal, pero se le pide en cada ingreso", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await cerrarSesion(page);

  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await expect(page).toHaveURL("/cambiar-contrasena");
  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page).toHaveURL("/recepcion");
  await expect(page.getByText("Sigues con una contraseña temporal.")).toBeVisible();
  await cerrarSesion(page);

  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await expect(page).toHaveURL("/cambiar-contrasena");
  await page.getByLabel("Nueva contraseña").fill("definitiva2026");
  await page.getByLabel("Confirma la contraseña").fill("definitiva2026");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page).toHaveURL("/recepcion");
  await expect(page.getByText("Sigues con una contraseña temporal.")).toHaveCount(0);
});
