import { expect, test } from "@playwright/test";

test("cada página llega con las cabeceras de seguridad y sin violar su política", async ({ page }) => {
  const violaciones: string[] = [];
  page.on("console", (mensaje) => {
    if (mensaje.text().includes("Content Security Policy")) violaciones.push(mensaje.text());
  });

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
