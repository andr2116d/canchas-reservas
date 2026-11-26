import { expect, type Page, test } from "@playwright/test";

/** Junta los avisos del navegador cuando la página rompe su política de contenido. */
function vigilarLaPolitica(pagina: Page) {
  const violaciones: string[] = [];
  pagina.on("console", (mensaje) => {
    if (mensaje.text().includes("Content Security Policy")) violaciones.push(mensaje.text());
  });
  return violaciones;
}

test("cada página llega con las cabeceras de seguridad y sin violar su política", async ({ page }) => {
  const violaciones = vigilarLaPolitica(page);

  const respuesta = await page.goto("/iniciar-sesion");
  const cabeceras = respuesta!.headers();

  expect(cabeceras["content-security-policy"]).toContain("default-src 'self'");
  expect(cabeceras["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(cabeceras["x-content-type-options"]).toBe("nosniff");
  expect(cabeceras["x-frame-options"]).toBe("DENY");
  expect(cabeceras["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  await expect(page.getByLabel("Correo")).toBeVisible();
  expect(violaciones).toEqual([]);
});

for (const ruta of ["/", "/legal/terminos", "/legal/privacidad", "/legal/cancelaciones", "/legal/cookies"]) {
  test(`${ruta} llega con la política de seguridad y no la viola`, async ({ page }) => {
    const violaciones = vigilarLaPolitica(page);

    const respuesta = await page.goto(ruta);

    expect(respuesta!.headers()["content-security-policy"]).toContain("default-src 'self'");
    expect(respuesta!.headers()["x-frame-options"]).toBe("DENY");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(violaciones).toEqual([]);
  });
}
