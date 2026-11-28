import { expect, type Page, test } from "@playwright/test";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// La regla de cancelación es una sola para el local: las pruebas que guardan van en orden y en un solo proyecto.
test.describe.configure({ mode: "serial" });

async function abrirCancelacion(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Reglas de reserva" }).first().click();
  await expect(pagina).toHaveURL("/administracion/reglas-de-reserva");
  await pagina.getByRole("tab", { name: "Cancelación" }).click();
}

const regla = (pagina: Page) => pagina.getByRole("region", { name: "Regla de cancelación" });
const simulador = (pagina: Page) => pagina.getByRole("region", { name: "Si alguien cancela…" });
const rango = (pagina: Page, numero: number) => regla(pagina).getByRole("group", { name: `Rango ${numero}` });
const horas = (pagina: Page, numero: number) => rango(pagina, numero).getByRole("textbox", { name: "Horas antes" });
const porcentaje = (pagina: Page, numero: number) => rango(pagina, numero).getByRole("textbox", { name: "Porcentaje que se devuelve" });

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "La regla es única: la guarda un solo proyecto.");

  test("define los rangos de anticipación, su porcentaje y si ofrecen crédito", async ({ page }) => {
    await abrirCancelacion(page);
    await expect(horas(page, 1)).toHaveValue("2");
    await porcentaje(page, 2).fill("40");

    await regla(page).getByRole("button", { name: "Guardar regla" }).click();

    await expect(regla(page).getByRole("status")).toContainText("las reservas ya hechas conservan la suya");
    await page.reload();
    await page.getByRole("tab", { name: "Cancelación" }).click();
    await expect(porcentaje(page, 2)).toHaveValue("40");
    await expect(rango(page, 1).getByRole("checkbox", { name: "También como crédito" })).toBeChecked();
    await expect(regla(page).getByText(/Vigente desde .* por Valeria León Paredes/)).toBeVisible();
  });

  test("no deja guardar horas o porcentajes vacíos ni negativos", async ({ page }) => {
    await abrirCancelacion(page);

    await horas(page, 1).fill("");
    await horas(page, 1).pressSequentially("-3");
    await expect(horas(page, 1)).toHaveValue("3");
    await porcentaje(page, 2).fill("");
    await regla(page).getByRole("button", { name: "Guardar regla" }).click();

    await expect(rango(page, 2).getByText("Ingresa el porcentaje que se devuelve.")).toBeVisible();
    const respuesta = await page.request.put("/api/cancelacion/regla", {
      data: { rangos: [{ desdeHoras: "-1", porcentaje: "100", ofreceCredito: false }] },
    });
    expect(respuesta.status()).toBe(400);
  });

  test("no deja negar la devolución en todos los casos y lo avisa mientras se edita", async ({ page }) => {
    await abrirCancelacion(page);

    for (const numero of [1, 2]) await porcentaje(page, numero).fill("0");

    await expect(regla(page).getByRole("alert")).toContainText("no se permite negar la devolución");
    await regla(page).getByRole("button", { name: "Guardar regla" }).click();
    await expect(rango(page, 1).getByText(/no se permite negar la devolución/)).toBeVisible();
  });

  test("el simulador muestra lo que recibiría el jugador según la anticipación", async ({ page }) => {
    await abrirCancelacion(page);
    await simulador(page).getByLabel("Pagó").fill("100");

    await expect(simulador(page).getByText("S/ 70.00")).toBeVisible();
    await simulador(page).getByRole("slider").focus();
    for (let paso = 0; paso < 6; paso++) await page.keyboard.press("ArrowRight");

    await expect(simulador(page).getByText("2 h", { exact: true })).toBeVisible();
    await expect(simulador(page).getByText("S/ 100.00")).toBeVisible();
    await expect(simulador(page).getByText("Crédito para otra reserva")).toBeVisible();
  });

  test("cada cambio queda en las reglas anteriores con sus valores, quién y cuándo", async ({ page }) => {
    await abrirCancelacion(page);
    await regla(page).getByRole("button", { name: "Agregar rango" }).click();
    await regla(page).getByRole("button", { name: "Guardar regla" }).click();
    await expect(regla(page).getByRole("status")).toContainText("Regla guardada");
    await page.reload();
    await page.getByRole("tab", { name: "Cancelación" }).click();

    await regla(page).getByText(/^Reglas anteriores/).click();
    await expect(regla(page).getByText("2 h: 100 % o crédito · 1 h: 40 % · 0 h: 0 %")).toBeVisible();
  });
});

test("solo administración define la regla de cancelación", async ({ page }) => {
  await registrarPorApi(page.request);

  expect((await page.request.put("/api/cancelacion/regla", { data: { rangos: [] } })).status()).toBe(403);
  await page.goto("/administracion/reglas-de-reserva");
  await expect(page.getByRole("heading", { name: "Esta zona no es para tu cuenta" })).toBeVisible();
});
