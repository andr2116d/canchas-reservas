import { expect, type Page, test } from "@playwright/test";

const SECCIONES = ["¿Cuántos juegan?", "De día y bajo los reflectores.", "Turnos libres.", "De la previa al pitazo.", "Preguntas frecuentes.", "Te esperamos."];
const PAGINAS_LEGALES = [
  { enlace: "Términos y condiciones", ruta: "/legal/terminos" },
  { enlace: "Política de privacidad", ruta: "/legal/privacidad" },
  { enlace: "Cancelaciones y devoluciones", ruta: "/legal/cancelaciones" },
  { enlace: "Política de cookies", ruta: "/legal/cookies" },
];

const pie = (pagina: Page) => pagina.getByRole("contentinfo");

test("la portada presenta el club con sus secciones y el menú lleva a cada una", async ({ page, isMobile }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Nos vemos en la cancha." })).toBeVisible();
  for (const seccion of SECCIONES) await expect(page.getByRole("heading", { level: 2, name: seccion })).toBeAttached();
  if (isMobile) await page.getByRole("button", { name: "Menú" }).click();
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Preguntas" }).click();

  await expect(page).toHaveURL("/#preguntas");
  await expect(page.getByRole("heading", { level: 2, name: "Preguntas frecuentes." })).toBeInViewport();
  const [ancho, visible] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(ancho).toBeLessThanOrEqual(visible);
});

test("el pie enlaza cada página legal y cada una dice desde cuándo rige", async ({ page }) => {
  for (const { enlace, ruta } of PAGINAS_LEGALES) {
    await page.goto("/");
    await pie(page).getByRole("link", { name: enlace }).click();

    await expect(page).toHaveURL(ruta);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/^Vigente desde el \d+ de \w+ de \d{4}\.$/)).toBeVisible();
  }
  await expect(pie(page).getByRole("link", { name: /Libro de Reclamaciones/ })).toHaveAttribute("href", "/libro-de-reclamaciones");
});

test.describe("aviso de cookies", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const aviso = (pagina: Page) => pagina.getByRole("region", { name: "Tus cookies, tu decisión." });
  const preferencia = async (pagina: Page) => (await pagina.context().cookies()).find((c) => c.name === "preferencia_de_cookies")?.value;

  test("rechazar pesa lo mismo que aceptar y la elección se recuerda", async ({ page }) => {
    await page.goto("/");
    const rechazar = aviso(page).getByRole("button", { name: "Solo necesarias" });
    const aceptar = aviso(page).getByRole("button", { name: "Aceptar todas" });
    const [cajaRechazar, cajaAceptar] = [await rechazar.boundingBox(), await aceptar.boundingBox()];
    expect(cajaRechazar?.width).toBe(cajaAceptar?.width);
    expect(cajaRechazar?.height).toBe(cajaAceptar?.height);

    await rechazar.click();

    await expect(aviso(page)).toBeHidden();
    expect(await preferencia(page)).toBe("necesarias");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(aviso(page)).toBeHidden();
  });

  test("acepta todas desde una página legal", async ({ page }) => {
    await page.goto("/legal/privacidad");

    await aviso(page).getByRole("button", { name: "Aceptar todas" }).click();

    await expect(aviso(page)).toBeHidden();
    expect(await preferencia(page)).toBe("todas");
  });

  test("se elige por tipo y se vuelve a abrir desde el pie para cambiarla", async ({ page }) => {
    await page.goto("/");
    await aviso(page).getByRole("button", { name: "Elegir cuáles" }).click();
    await expect(aviso(page).getByRole("checkbox", { name: /Necesarias/ })).toBeDisabled();
    await aviso(page).getByRole("checkbox", { name: /Medición/ }).check();
    await aviso(page).getByRole("button", { name: "Guardar mi elección" }).click();
    expect(await preferencia(page)).toBe("todas");

    await pie(page).getByRole("button", { name: "Preferencias de cookies" }).click();
    await aviso(page).getByRole("button", { name: "Solo necesarias" }).click();

    await expect(aviso(page)).toBeHidden();
    expect(await preferencia(page)).toBe("necesarias");
  });
});
