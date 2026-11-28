import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { unJugadorNuevo, VERSION_LEGAL_DEL_REGISTRO } from "../../soporte/jugador-de-prueba";
import { CONTRASENA_TEMPORAL, crearAdministradorDePrueba, DOMINIO_DE_PRUEBA } from "../../soporte/personal-de-prueba";
import { completarDatosDelAdministrador, confirmarMisDatos } from "../../soporte/sesiones-de-prueba";

const RUTA_DE_ACCESO = "/iniciar-sesion";
const CONTRASENA_NUEVA = "definitiva2026";

async function crearJugador(page: Page) {
  const jugador = unJugadorNuevo();
  const respuesta = await page.request.post("/api/jugadores", {
    data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: VERSION_LEGAL_DEL_REGISTRO },
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
  await expect(segundaPestana.getByRole("button", { name: "Mi cuenta" })).toBeVisible();

  await page.getByRole("button", { name: "Mi cuenta" }).click();
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
  await request.post("/api/jugadores", { data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: VERSION_LEGAL_DEL_REGISTRO } });
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

/** Comprueba que la cuenta ve el aviso de que no puede entrar a esa pantalla. */
async function esperarSinPermiso(pagina: Page) {
  await expect(pagina).toHaveURL("/acceso-no-autorizado");
  await expect(pagina.getByRole("heading", { level: 1, name: "Esta zona no es para tu cuenta" })).toBeVisible();
  await expect(pagina.getByText("Tu cuenta no tiene permiso para abrir esta pantalla.")).toBeVisible();
}

test("lleva al acceso si falta la sesión y bloquea paneles ajenos por URL directa", async ({ page }) => {
  const jugador = await crearJugador(page);
  await page.goto("/administracion", { waitUntil: "commit" });
  await expect(page).toHaveURL(RUTA_DE_ACCESO);
  await iniciar(page, jugador.correo, jugador.contrasena);
  await expect(page).toHaveURL("/inicio");

  await page.goto("/recepcion", { waitUntil: "commit" });

  await esperarSinPermiso(page);
  await expect(page.getByRole("heading", { name: "Agenda" })).toHaveCount(0);
  await page.goto("/administracion", { waitUntil: "commit" });
  await esperarSinPermiso(page);
  await expect(page.getByRole("heading", { name: "Administración" })).toHaveCount(0);
  await page.getByRole("link", { name: "Ir a mi panel" }).click();
  await expect(page).toHaveURL("/inicio");
});

test("obliga al administrador y al recepcionista a cambiar su contraseña temporal", async ({ page }) => {
  const admin = crearAdministradorDePrueba();
  await page.goto(RUTA_DE_ACCESO);
  await iniciar(page, admin.correo, admin.contrasena);
  await expect(page).toHaveURL("/completar-datos");
  await completarDatosDelAdministrador(page);
  await page.goto("/administracion");
  await expect(page).toHaveURL("/cambiar-contrasena");

  await cambiarContrasena(page);
  await expect(page).toHaveURL("/administracion");
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  for (const ajena of ["/inicio", "/recepcion"]) {
    // El panel ajeno redirige mientras carga: basta con que la navegación empiece.
    await page.goto(ajena, { waitUntil: "commit" });
    await esperarSinPermiso(page);
  }
  await page.getByRole("link", { name: "Ir a mi panel" }).click();
  await expect(page).toHaveURL("/administracion");
  const usuarioDeCorreo = "turno." + randomUUID().slice(0, 8);
  const recepcion = { correo: usuarioDeCorreo + "@" + DOMINIO_DE_PRUEBA, contrasena: CONTRASENA_TEMPORAL };
  const creada = await page.request.post("/api/recepcionistas", {
    data: {
      nombres: "Mateo", apellidos: "Paz León", fechaNacimiento: "1994-06-12", tipoDocumento: "DNI",
      numeroDocumento: String(40000000 + Math.floor(Math.random() * 9999999)), celular: "912345678",
      usuarioDeCorreo, contrasena: CONTRASENA_TEMPORAL,
    },
  });
  expect(creada.status()).toBe(201);
  await page.getByRole("button", { name: "Mi cuenta" }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page).toHaveURL(RUTA_DE_ACCESO);
  await iniciar(page, recepcion.correo, recepcion.contrasena);
  await confirmarMisDatos(page);
  await cambiarContrasena(page);
  await expect(page).toHaveURL("/recepcion");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  for (const ajena of ["/administracion", "/inicio"]) {
    // El panel ajeno redirige mientras carga: basta con que la navegación empiece.
    await page.goto(ajena, { waitUntil: "commit" });
    await esperarSinPermiso(page);
  }
});

test("regresa al acceso cuando vence la sesión abierta", async ({ page }) => {
  const jugador = await crearJugador(page);
  await page.clock.install();
  await page.goto(RUTA_DE_ACCESO);
  await iniciar(page, jugador.correo, jugador.contrasena);
  await expect(page.getByRole("button", { name: "Mi cuenta" })).toBeVisible();

  await page.context().clearCookies({ name: "sesion" });
  await page.clock.fastForward(15 * 60 * 1000 + 1000);

  await expect(page).toHaveURL(RUTA_DE_ACCESO + "?motivo=inactividad");
  await expect(page.getByRole("status")).toHaveText("Tu sesión se cerró por inactividad.");
});
