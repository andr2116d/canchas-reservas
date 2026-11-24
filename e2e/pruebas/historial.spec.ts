import { randomInt } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";
import { unJugadorNuevo } from "../soporte/jugador-de-prueba";
import { crearAdministradorDePrueba } from "../soporte/personal-de-prueba";
import { entrarComoAdministrador } from "../soporte/recepcionistas-de-prueba";

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

  test("administración ve quién cambió qué y cuándo, con el antes y el después", async ({ page }) => {
    await entrarComoAdministrador(page);
    const nombre = `Pelota ${randomInt(1000, 9999)}`;
    const alta = await page.request.post("/api/adicionales", { data: { nombre, precio: "10" } });
    const { id } = (await alta.json()) as { id: number };
    await page.request.put(`/api/adicionales/${id}`, { data: { nombre, precio: "12" } });
    await page.getByRole("button", { name: "Mi cuenta" }).click();
    await page.getByRole("link", { name: "Historial de cambios" }).click();

    await page.getByRole("group", { name: "Categoría" }).getByRole("button", { name: "Adicionales" }).click();
    await page.getByLabel("Acción").selectOption("EDICION");
    await expect(page).toHaveURL(/categoria=ADICIONALES&accion=EDICION/);
    const edicion = registros(page).filter({ hasText: `editó el adicional ${nombre}` });

    await expect(edicion).toContainText("Importante");
    await edicion.getByText("Ver qué cambió").click();
    await expect(edicion.getByRole("row", { name: /Precio por unidad/ })).toContainText("S/ 10.00");
    await expect(edicion.getByRole("row", { name: /Precio por unidad/ })).toContainText("S/ 12.00");
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
    // La última sesión queda en el navegador: solo falta dejar el cambio de contraseña para después.
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
