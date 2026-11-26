import { expect, type Page, test } from "@playwright/test";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// El adelanto es uno solo para el local: solo este archivo lo guarda, en orden y en un solo proyecto.
test.describe.configure({ mode: "serial" });

async function abrirTarifas(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Reglas de reserva" }).first().click();
  await expect(pagina).toHaveURL("/administracion/reglas-de-reserva");
  await pagina.getByRole("tab", { name: "Tarifas" }).click();
}

const tarjeta = (pagina: Page) => pagina.getByRole("region", { name: "Adelanto mínimo" });
const porcentaje = (pagina: Page) => tarjeta(pagina).getByLabel(/^Porcentaje del precio del turno/);

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "El adelanto es único: lo guarda un solo proyecto.");

  test("administración define el adelanto mínimo y queda en el historial", async ({ page }) => {
    await abrirTarifas(page);
    const nuevo = (await porcentaje(page).inputValue()) === "45" ? "35" : "45";

    await porcentaje(page).fill(nuevo);
    await expect(tarjeta(page).getByText(`Por cada S/ 100 del turno se pagan S/ ${nuevo} para separarlo.`)).toBeVisible();
    await tarjeta(page).getByRole("button", { name: "Guardar adelanto" }).click();

    await expect(tarjeta(page).getByRole("status")).toContainText("las reservas ya hechas no cambian");
    await page.reload();
    await page.getByRole("tab", { name: "Tarifas" }).click();
    await expect(porcentaje(page)).toHaveValue(nuevo);
    await expect(tarjeta(page).getByText(/Vigente desde .* por Valeria León Paredes/)).toBeVisible();
    await page.goto("/administracion/historial?categoria=ADELANTO");
    await expect(page.getByText(/(definió|cambió) el adelanto mínimo/).first()).toBeVisible();
  });

  test("no deja guardar un porcentaje fuera de 1 a 100", async ({ page }) => {
    await abrirTarifas(page);

    await porcentaje(page).fill("0");
    await tarjeta(page).getByRole("button", { name: "Guardar adelanto" }).click();

    await expect(tarjeta(page).getByText("Usa un número entero de 1 a 100.")).toBeVisible();
    const respuesta = await page.request.put("/api/adelanto", { data: { porcentaje: "101" } });
    expect(respuesta.status()).toBe(400);
  });
});
