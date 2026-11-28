import { expect, test } from "@playwright/test";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { asuntosRecibidos, correoUnico, llenarHoja, registrarHojaPorApi } from "../../soporte/libro-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

test("el pie de cualquier página lleva al Libro de Reclamaciones", async ({ page }) => {
  await page.goto("/legal/terminos");

  await page.getByRole("contentinfo").getByRole("link", { name: /Libro de Reclamaciones/ }).click();

  await expect(page).toHaveURL("/libro-de-reclamaciones");
  await expect(page.getByRole("heading", { level: 1, name: "Registra tu reclamo o queja" })).toBeVisible();
});

test("sin cuenta registra una hoja en tres pasos y recibe su constancia y la copia por correo", async ({ page, request }) => {
  const correo = correoUnico();
  await page.goto("/libro-de-reclamaciones");

  await llenarHoja(page, correo);
  await page.getByRole("button", { name: "Enviar hoja" }).click();

  await expect(page.getByRole("heading", { name: "Registramos tu hoja" })).toBeVisible();
  const numero = (await page.getByText(/^\d{6}-\d{4}$/).first().textContent())!;
  await expect(page.getByText(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)).toBeVisible();
  expect(await asuntosRecibidos(request, correo)).toContain(`Hoja de reclamación N.º ${numero}`);
});

test("no deja avanzar sin los datos del paso y, si es menor de edad, pide a su representante", async ({ page }) => {
  await page.goto("/libro-de-reclamaciones");

  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByLabel(/^Nombres/)).toHaveAccessibleDescription("Ingresa tus nombres.");
  await page.getByRole("checkbox", { name: "Soy menor de edad" }).check();

  await expect(page.getByRole("group", { name: "Tu padre, madre o representante" })).toBeVisible();
});

test("sigue su hoja con el número y el código; un código equivocado no muestra nada", async ({ page, request }) => {
  const { numero, codigo } = await registrarHojaPorApi(request);
  await page.goto("/libro-de-reclamaciones/seguimiento");

  await page.getByLabel(/^Número de hoja/).fill(numero);
  await page.getByLabel(/^Código de seguimiento/).fill("AAAA-AAAA");
  await page.getByRole("button", { name: "Ver mi hoja" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No encontramos una hoja" })).toContainText("con ese número y código");

  await page.getByLabel(/^Código de seguimiento/).fill(codigo.toLowerCase());
  await page.getByRole("button", { name: "Ver mi hoja" }).click();
  await expect(page.getByRole("heading", { name: `Hoja ${numero}` })).toBeVisible();
  await expect(page.getByRole("list", { name: "Avance de la hoja" }).getByText("Recibida")).toBeVisible();
});

test("administración recibe el aviso al momento y atiende la hoja hasta responderla", async ({ page, request }) => {
  // Inicia sesión de administración y recorre la atención completa.
  test.setTimeout(60_000);
  await entrarComoAdministrador(page);
  await expect(page.getByRole("button", { name: /^Avisos/ })).toBeVisible();

  const { numero } = await registrarHojaPorApi(request);

  await expect(page.getByRole("button", { name: /^Avisos, \d+ sin leer/ })).toBeVisible({ timeout: 10_000 });
  // Otras pruebas registran hojas a la vez: el aviso flotante puede ser de cualquiera de ellas.
  await expect(page.getByRole("status").filter({ hasText: "Nueva hoja de reclamación" })).toBeVisible();
  await page.getByRole("button", { name: /^Avisos/ }).click();
  await page.getByRole("link", { name: new RegExp(`Nueva hoja de reclamación ${numero}`) }).click();

  await expect(page).toHaveURL(`/administracion/reclamos/${numero}`);
  await expect(page.getByText("En atención", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Motivo").selectOption("ESTADO_DE_LA_CANCHA");
  await expect(page.getByText(/La clasificó como «Estado de la cancha»/)).toBeVisible();
  await page.getByLabel(/^Acciones adoptadas/).fill("Devolvimos el adelanto de S/ 40.00.");
  await page.getByRole("button", { name: "Revisar y enviar" }).click();
  await page.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(page.getByRole("heading", { name: "Respuesta" })).toBeVisible();
  await expect(page.getByText("Devolvimos el adelanto de S/ 40.00.")).toBeVisible();
});

test("la lista de reclamos filtra por estado y número, y la respuesta queda en el historial", async ({ page, request }) => {
  // Inicia sesión de administración y recorre la atención completa.
  test.setTimeout(60_000);
  await entrarComoAdministrador(page);
  const { numero } = await registrarHojaPorApi(request, { tipo: "QUEJA" });
  await page.goto("/administracion/reclamos");

  await page.getByLabel("Número de hoja").fill(numero);
  await page.getByRole("button", { name: "Buscar" }).click();
  const fila = page.getByRole("link", { name: new RegExp(numero) });
  await expect(fila).toContainText("Queja");
  await expect(fila).toContainText("Sin clasificar");
  await fila.click();
  await page.getByRole("button", { name: "Tramitar como reclamo" }).click();
  await expect(page.getByText(/La persona la marcó como queja/)).toBeVisible();
  await page.getByLabel(/^Acciones adoptadas/).fill("Conversamos con el personal de recepción.");
  await page.getByRole("button", { name: "Revisar y enviar" }).click();
  await page.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(page.getByRole("heading", { name: "Respuesta" })).toBeVisible();

  await page.goto("/administracion/historial?categoria=RECLAMOS");
  await expect(page.getByText(`Hoja ${numero}`).first()).toBeVisible();
  await expect(page.getByText("respondió la").first()).toBeVisible();
});

test("el jugador ve en «Mis reclamos» la respuesta a la hoja que registró con su cuenta", async ({ page, browser }) => {
  // Inicia sesión de administración y recorre la atención completa.
  test.setTimeout(60_000);
  await registrarPorApi(page.request);
  const { numero } = await registrarHojaPorApi(page.request);

  const administracion = await browser.newPage();
  await entrarComoAdministrador(administracion);
  await administracion.goto(`/administracion/reclamos/${numero}`);
  await administracion.getByLabel(/^Acciones adoptadas/).fill("Devolvimos el adelanto.");
  await administracion.getByRole("button", { name: "Revisar y enviar" }).click();
  await administracion.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(administracion.getByRole("heading", { name: "Respuesta" })).toBeVisible();
  await administracion.close();

  await page.goto("/inicio/reclamos");
  await page.getByRole("link", { name: new RegExp(numero) }).click();
  await expect(page.getByText("Devolvimos el adelanto.")).toBeVisible();
  await page.getByRole("button", { name: /^Avisos, 1 sin leer/ }).click();
  await expect(page.getByRole("link", { name: new RegExp(`Respondimos tu hoja ${numero}`) })).toBeVisible();
});
