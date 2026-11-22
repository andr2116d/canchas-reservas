import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { unJugadorNuevo } from "../soporte/jugador-de-prueba";
import { CONTRASENA_TEMPORAL, crearAdministradorDePrueba } from "../soporte/personal-de-prueba";

const RUTA_DE_ACCESO = "/iniciar-sesion";
const CONTRASENA_NUEVA = "definitiva2026";

async function crearJugador(page: Page) {
  const jugador = unJugadorNuevo();
  const respuesta = await page.request.post("/api/jugadores", {
    data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: "registro-1" },
  });
  expect(respuesta.status()).toBe(201);
  await page.request.delete("/api/sesiones/actual");
  return jugador;
}

async function iniciar(page: Page, correo: string, contrasena: string) {
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function cambiarContrasena(page: Page) {
  await page.getByLabel("Nueva contraseña").fill(CONTRASENA_NUEVA);
  await page.getByLabel("Confirma la contraseña").fill(CONTRASENA_NUEVA);
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
}

test("conecta el acceso y el registro con la misma cancha y un enlace junto al título", async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    const iniciarTransicion = document.startViewTransition?.bind(document);
    if (!iniciarTransicion) return;
    let cambios = 0;
    document.startViewTransition = (opciones) => {
      if (typeof opciones === "object" && opciones.types?.includes("cambio-de-acceso")) {
        document.documentElement.dataset.cambiosDeAcceso = String(++cambios);
      }
      return iniciarTransicion(opciones);
    };
  });
  await page.goto(RUTA_DE_ACCESO);
  const canchaDeAcceso = page.locator(".fondo-de-cancha--acceso");
  await expect(canchaDeAcceso.locator("svg")).toBeVisible();
  await expect(canchaDeAcceso).toHaveCSS("background-image", /repeating-linear-gradient/);
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeInViewport({ ratio: 1 });
  await page.getByRole("link", { name: "Crea tu cuenta de jugador" }).click();
  await expect(page).toHaveURL("/registro");
  const canchaDeRegistro = page.getByRole("complementary").locator(".fondo-de-cancha--registro");
  await expect(canchaDeRegistro.locator("svg")).toBeVisible();
  await expect(canchaDeRegistro).toHaveCSS("background-image", /repeating-linear-gradient/);
  await expect(page.locator("html")).toHaveAttribute("data-cambios-de-acceso", "1");

  const volver = page.getByRole("main").getByRole("link", { name: "Inicia sesión" });
  await expect(volver).toBeInViewport({ ratio: 1 });
  await volver.click();

  await expect(page).toHaveURL(RUTA_DE_ACCESO);
  await expect(page.locator("html")).toHaveAttribute("data-cambios-de-acceso", "2");
});

test.describe("Acceso sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("muestra la tarjeta de acceso de inmediato, sin esperar la sesión", async ({ page }) => {
    await page.goto(RUTA_DE_ACCESO);

    await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });
});

test("recuerda el correo al cerrar sesión y permite que el navegador complete la contraseña", async ({ page }) => {
  const jugador = await crearJugador(page);
  await page.goto(RUTA_DE_ACCESO);
  await page.getByRole("checkbox", { name: "Recordarme" }).check();
  await iniciar(page, jugador.correo, jugador.contrasena);
  await expect(page).toHaveURL("/inicio");
  await expect(page.getByRole("heading", { name: "Hola, Valeria." })).toBeVisible();
  const segundaPestana = await page.context().newPage();
  await segundaPestana.goto("/inicio");
  await expect(segundaPestana.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page).toHaveURL(RUTA_DE_ACCESO);
  await expect(segundaPestana).toHaveURL(RUTA_DE_ACCESO);
  await expect(page.getByLabel("Correo")).toHaveValue(jugador.correo);
  const contrasena = page.getByLabel("Contraseña", { exact: true });
  await expect(contrasena).toHaveAttribute("autocomplete", "current-password");
  await expect(contrasena).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Recordarme" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Recordarme" }).uncheck();
  await page.reload();
  await expect(page.getByLabel("Correo")).toHaveValue("");
});

test("lleva al panel aunque el panel tarde en cargar", async ({ page, request }) => {
  const jugador = unJugadorNuevo();
  await request.post("/api/jugadores", { data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: "registro-1" } });
  await page.context().clearCookies();
  await page.route("**/inicio**", async (ruta) => {
    await new Promise((resolver) => setTimeout(resolver, 2500));
    await ruta.continue();
  });
  await page.goto(RUTA_DE_ACCESO);

  await page.getByLabel(/^Correo/).fill(jugador.correo);
  await page.getByLabel(/^Contraseña/).fill(jugador.contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL("/inicio", { timeout: 15_000 });
});

test("rechaza credenciales inválidas con un mensaje genérico", async ({ page }) => {
  await page.goto(RUTA_DE_ACCESO);
  await iniciar(page, "nadie@externo.test", "incorrecta1");

  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Correo o contraseña incorrectos.");
  await expect(page).toHaveURL(RUTA_DE_ACCESO);
});

test("lleva al acceso si falta la sesión y bloquea paneles ajenos por URL directa", async ({ page }) => {
  const jugador = await crearJugador(page);
  await page.goto("/administracion");
  await expect(page).toHaveURL(RUTA_DE_ACCESO);
  await iniciar(page, jugador.correo, jugador.contrasena);
  await expect(page).toHaveURL("/inicio");

  await page.goto("/recepcion");

  await expect(page).toHaveURL("/acceso-no-autorizado");
  await expect(page.getByRole("heading", { name: "Acceso no autorizado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recepción" })).toHaveCount(0);
  await page.getByRole("link", { name: "Volver a mi panel" }).click();
  await expect(page).toHaveURL("/inicio");
});

test("obliga al administrador y al recepcionista a cambiar su contraseña temporal", async ({ page }) => {
  const admin = crearAdministradorDePrueba();
  await page.goto(RUTA_DE_ACCESO);
  await iniciar(page, admin.correo, admin.contrasena);
  await expect(page).toHaveURL("/cambiar-contrasena");
  await page.goto("/administracion");
  await expect(page).toHaveURL("/cambiar-contrasena");

  await cambiarContrasena(page);
  await expect(page).toHaveURL("/administracion");
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  const recepcion = { correo: "turno." + randomUUID() + "@externo.test", contrasena: CONTRASENA_TEMPORAL };
  const creada = await page.request.post("/api/recepcionistas", {
    data: { ...recepcion, nombres: "Mateo", apellidos: "Paz León" },
  });
  expect(creada.status()).toBe(201);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page).toHaveURL(RUTA_DE_ACCESO);
  await iniciar(page, recepcion.correo, recepcion.contrasena);
  await expect(page).toHaveURL("/cambiar-contrasena");
  await cambiarContrasena(page);
  await expect(page).toHaveURL("/recepcion");
  await expect(page.getByRole("heading", { name: "Recepción" })).toBeVisible();
  await page.goto("/administracion");
  await expect(page).toHaveURL("/acceso-no-autorizado");
});

test("regresa al acceso cuando vence la sesión abierta", async ({ page }) => {
  const jugador = await crearJugador(page);
  await page.clock.install();
  await page.goto(RUTA_DE_ACCESO);
  await iniciar(page, jugador.correo, jugador.contrasena);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();

  await page.context().clearCookies({ name: "sesion" });
  await page.clock.fastForward(15 * 60 * 1000 + 1000);

  await expect(page).toHaveURL(RUTA_DE_ACCESO + "?motivo=inactividad");
  await expect(page.getByRole("status")).toHaveText("Tu sesión se cerró por inactividad.");
});
