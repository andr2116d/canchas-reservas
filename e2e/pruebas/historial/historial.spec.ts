import { expect, type Page, test } from "@playwright/test";
import { unJugadorNuevo } from "../../soporte/jugador-de-prueba";
import { crearAdministradorDePrueba } from "../../soporte/personal-de-prueba";
import { crearPorApi } from "../../soporte/recepcionistas-de-prueba";
import { completarDatosDelAdministrador, entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

async function abrirHistorial(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("button", { name: "Mi cuenta" }).click();
  await pagina.getByRole("link", { name: "Historial de cambios" }).click();
  await expect(pagina).toHaveURL("/administracion/historial");
  await expect(pagina.getByRole("heading", { name: "Historial de cambios" })).toBeVisible();
}

const registros = (pagina: Page) => pagina.locator(".linea-de-tiempo").getByRole("listitem");

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "Los filtros se prueban una vez.");

  test("administración ve quién cambió qué, sobre quién y cuándo, y lo importante resaltado", async ({ page }) => {
    await entrarComoAdministrador(page);
    const recepcionista = await crearPorApi(page);
    await page.request.post(`/api/recepcionistas/${recepcionista.id}/desactivacion`);
    await page.getByRole("button", { name: "Mi cuenta" }).click();
    await page.getByRole("link", { name: "Historial de cambios" }).click();

    await page.getByRole("group", { name: "Categoría" }).getByRole("button", { name: "Cuentas" }).click();
    await page.getByLabel("Acción").selectOption("DESACTIVACION");
    await expect(page).toHaveURL(/categoria=CUENTAS&accion=DESACTIVACION/);
    const nombre = `${recepcionista.nombres} ${recepcionista.apellidos}`;

    await expect(registros(page).filter({ hasText: `desactivó la cuenta de ${nombre}` })).toContainText("Importante");
  });

  test("los atajos de período filtran por días de Lima", async ({ page }) => {
    await abrirHistorial(page);
    const periodo = page.getByRole("group", { name: "Período" });

    await periodo.getByRole("button", { name: "Hoy" }).click();

    await expect(periodo.getByRole("button", { name: "Hoy" })).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/desde=(\d{4}-\d{2}-\d{2})&hasta=\1/);
    await expect(page.locator(".dia-del-historial")).toHaveText(["Hoy"]);
  });

  test("sin registros que cumplan lo dice, y con la fecha final antes de la inicial no filtra", async ({ page }) => {
    await abrirHistorial(page);

    await page.getByLabel("Desde").fill("2099-01-01");
    await expect(page.getByRole("heading", { name: "No hay registros con estos filtros" })).toBeVisible();
    await page.getByLabel("Hasta").fill("2098-01-01");

    await expect(page.getByRole("alert").filter({ hasText: "La fecha final es anterior a la inicial" })).toBeVisible();
    await expect(page).toHaveURL(/desde=2099-01-01$/);
    await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
    await expect(registros(page).first()).toBeVisible();
  });

  test("muestra los registros de a pocos y avanza de página", async ({ page }) => {
    // Once inicios de sesión de un administrador propio: más de una página sin depender de otras pruebas.
    const admin = crearAdministradorDePrueba();
    for (let vez = 0; vez < 11; vez++) await page.request.post("/api/sesiones", { data: admin });
    // La última sesión queda en el navegador: faltan sus datos y dejar la contraseña para después.
    await completarDatosDelAdministrador(page);
    await page.goto("/cambiar-contrasena");
    await page.getByRole("button", { name: "Ahora no" }).click();
    await expect(page).toHaveURL("/administracion", { timeout: 20_000 });
    await page.goto("/administracion/historial");

    await page.getByRole("group", { name: "Por página" }).getByRole("button", { name: "10" }).click();
    await expect(page.getByText("1–10", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Página siguiente" }).click();

    await expect(page.getByText(/^11–\d+$/)).toBeVisible();
    await expect(page).toHaveURL(/pagina=2/);
  });
});

test("un jugador no ve el historial ni puede abrirlo por la dirección", async ({ page }) => {
  const jugador = unJugadorNuevo();
  await page.request.post("/api/jugadores", { data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: "registro-1" } });
  await page.goto("/inicio");

  await page.getByRole("button", { name: "Mi cuenta" }).click();
  await expect(page.getByRole("link", { name: "Ver mi cuenta" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial de cambios" })).toHaveCount(0);
  await page.goto("/administracion/historial", { waitUntil: "commit" });
  await expect(page).toHaveURL("/acceso-no-autorizado");
});
