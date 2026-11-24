import { expect, test } from "@playwright/test";

test("una dirección que no existe responde 404 y ofrece volver al inicio", async ({ page }) => {
  const respuesta = await page.goto("/esta-cancha-no-existe");

  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Esta cancha no existe" })).toBeVisible();
  await expect(page.getByText("La dirección que abriste no lleva a ninguna página.")).toBeVisible();
  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page).toHaveURL("/");
});

test("el aviso de dirección inexistente no deja desplazar la pantalla de lado", async ({ page }) => {
  await page.goto("/esta-cancha-no-existe");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(desborde).toBeLessThanOrEqual(0);
});
