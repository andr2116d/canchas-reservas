import { randomInt } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";
import { entrarComoAdministrador } from "../soporte/recepcionistas-de-prueba";

// El catálogo es del local: la lista vacía y los nombres únicos necesitan un orden.
test.describe.configure({ mode: "serial" });

async function abrirAdicionales(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Adicionales" }).first().click();
  await expect(pagina).toHaveURL("/administracion/adicionales");
}

async function vaciarCatalogo(pagina: Page) {
  const adicionales = (await (await pagina.request.get("/api/adicionales")).json()) as { id: number }[];
  for (const { id } of adicionales) await pagina.request.delete(`/api/adicionales/${id}`);
}

const nombreUnico = (base: string) => `${base} ${randomInt(1000, 9999)}`;
const alta = (pagina: Page) => pagina.getByRole("form", { name: "Agregar adicional" });
const fila = (pagina: Page, nombre: string) => pagina.getByRole("list", { name: "Catálogo" }).getByRole("listitem").filter({ hasText: nombre });
const aviso = (pagina: Page, texto: string) => pagina.getByRole("status").filter({ hasText: texto });

async function agregar(pagina: Page, nombre: string, precio: string, descripcion = "") {
  await alta(pagina).getByLabel(/^Nombre/).fill(nombre);
  await alta(pagina).getByLabel(/^Precio por unidad/).fill(precio);
  if (descripcion) await alta(pagina).getByLabel(/^Descripción/).fill(descripcion);
  await alta(pagina).getByRole("button", { name: "Agregar al catálogo" }).click();
}

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "El catálogo es del local: lo cambia un solo proyecto.");

  test("registra un adicional con nombre, descripción y precio por unidad", async ({ page }) => {
    await abrirAdicionales(page);
    await vaciarCatalogo(page);
    await page.reload();

    await expect(page.getByRole("heading", { name: "Aún no hay adicionales" })).toBeVisible();
    await page.getByRole("button", { name: "Balón", exact: true }).click();
    await alta(page).getByLabel(/^Precio por unidad/).fill("45");
    await alta(page).getByLabel(/^Descripción/).fill("N.º 5, cuero sintético");
    await alta(page).getByRole("button", { name: "Agregar al catálogo" }).click();

    await expect(aviso(page, "Balón se agregó al catálogo.")).toBeVisible();
    await expect(fila(page, "Balón")).toContainText("N.º 5, cuero sintético");
    await expect(fila(page, "Balón")).toContainText("S/ 45.00");
  });

  test("el precio no admite negativos ni letras y con cero no se guarda", async ({ page }) => {
    await abrirAdicionales(page);
    const precio = alta(page).getByLabel(/^Precio por unidad/);

    await precio.pressSequentially("-1a2");
    await expect(precio).toHaveValue("12");
    await precio.fill("0");
    await alta(page).getByLabel(/^Nombre/).fill(nombreUnico("Conos"));
    await alta(page).getByRole("button", { name: "Agregar al catálogo" }).click();

    await expect(alta(page).getByText("El monto debe ser mayor que cero.")).toBeVisible();
    await expect(page.getByRole("list", { name: "Catálogo" }).getByRole("listitem")).toHaveCount(1);
  });

  test("si el nombre ya existe, avisa y no guarda", async ({ page }) => {
    await abrirAdicionales(page);

    await agregar(page, "BALON", "40");

    await expect(alta(page).getByText("Ya existe un adicional llamado «BALON».")).toBeVisible();
    await expect(page.getByRole("list", { name: "Catálogo" }).getByRole("listitem")).toHaveCount(1);
  });

  test("edita el nombre y el precio; el cambio queda registrado con el antes y el después", async ({ page }) => {
    await abrirAdicionales(page);

    await fila(page, "Balón").getByRole("button", { name: "Editar" }).click();
    const edicion = page.getByRole("dialog", { name: "Editar Balón" });
    await edicion.getByLabel(/^Nombre/).fill("Pelota");
    await edicion.getByLabel(/^Precio por unidad/).fill("50");
    await edicion.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(aviso(page, "Se guardaron los cambios de Pelota.")).toBeVisible();
    await expect(fila(page, "Pelota")).toContainText("S/ 50.00");
    await page.getByText("Cambios recientes").click();
    await expect(page.getByText("editó Pelota: nombre Balón → Pelota · precio S/ 45.00 → S/ 50.00")).toBeVisible();
  });

  test("desactiva y reactiva un adicional", async ({ page }) => {
    await abrirAdicionales(page);

    await fila(page, "Pelota").getByRole("button", { name: "Desactivar" }).click();
    await expect(aviso(page, "Pelota quedó desactivado")).toBeVisible();
    await expect(fila(page, "Pelota").getByText("Desactivado")).toBeVisible();
    await fila(page, "Pelota").getByRole("button", { name: "Reactivar" }).click();

    await expect(aviso(page, "Pelota vuelve a estar disponible.")).toBeVisible();
    await expect(fila(page, "Pelota").getByText("Desactivado")).toHaveCount(0);
  });

  test("elimina uno que nunca se usó, tras confirmar", async ({ page }) => {
    await abrirAdicionales(page);
    const nombre = nombreUnico("Por error");
    await agregar(page, nombre, "5");
    await expect(fila(page, nombre)).toBeVisible();

    await fila(page, nombre).getByRole("button", { name: "Eliminar" }).click();
    await fila(page, nombre).getByRole("button", { name: "Sí, eliminar" }).click();

    await expect(aviso(page, `${nombre} se eliminó.`)).toBeVisible();
    await expect(fila(page, nombre)).toHaveCount(0);
  });
});

test.describe("en el celular", () => {
  test.skip(({ isMobile }) => !isMobile, "Solo revisa la vista angosta.");

  test("el catálogo y el alta caben sin desplazarse de lado", async ({ page }) => {
    await abrirAdicionales(page);

    await expect(alta(page)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
