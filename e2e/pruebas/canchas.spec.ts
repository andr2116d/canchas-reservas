import { randomInt } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";
import { entrarComoAdministrador } from "../soporte/recepcionistas-de-prueba";

// Las canchas son del local: la primera vez necesita la lista vacía, así que el archivo va en orden.
test.describe.configure({ mode: "serial" });

async function abrirCanchas(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Canchas" }).first().click();
  await expect(pagina).toHaveURL("/administracion/canchas");
}

async function vaciarCanchas(pagina: Page) {
  const canchas = (await (await pagina.request.get("/api/canchas")).json()) as { id: number }[];
  for (const { id } of canchas) await pagina.request.delete(`/api/canchas/${id}`);
}

const nombreUnico = (base: string) => `${base} ${randomInt(1000, 9999)}`;
const ficha = (pagina: Page, nombre: string) => pagina.getByRole("article", { name: nombre });
const pestana = (pagina: Page, nombre: "Canchas" | "Mantenimiento") =>
  pagina.getByRole("navigation", { name: "Secciones de canchas" }).getByRole("link", { name: new RegExp(`^${nombre}`) });
const aviso = (pagina: Page, texto: string) => pagina.getByRole("status").filter({ hasText: texto });

async function agregarUna(pagina: Page, nombre: string) {
  await pagina.getByRole("button", { name: "Una", exact: true }).click();
  await pagina.getByLabel(/^Nombre/).fill(nombre);
  await pagina.getByRole("button", { name: "Fútbol 5", exact: true }).click();
  await pagina.getByRole("button", { name: "Sin luz" }).click();
  await pagina.getByRole("button", { name: "Agregar cancha" }).click();
}

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "Las canchas son del local: las crea un solo proyecto.");

  test("la primera vez registra varias canchas a la vez, operativas, y señala dónde quedaron", async ({ page }) => {
    await abrirCanchas(page);
    await vaciarCanchas(page);
    await page.reload();

    await expect(page.getByRole("heading", { name: "Agrega las canchas del local" })).toBeVisible();
    await page.getByRole("button", { name: "Una más de fútbol 7" }).click();
    await page.getByRole("button", { name: "Con luz" }).click();
    await page.getByRole("button", { name: "Bancas" }).click();
    await page.getByRole("button", { name: "Agregar 3 canchas" }).click();

    await expect(aviso(page, "Se agregaron 3 canchas, todas operativas.")).toBeVisible();
    await expect(page.getByText(/Estas son tus canchas/)).toBeVisible();
    await expect(page.getByText("¿Faltan canchas? Agrégalas aquí cuando quieras.")).toBeVisible();
    const tercera = ficha(page, "Cancha 3");
    await expect(tercera.getByText("Operativa")).toBeVisible();
    await expect(tercera.getByText("Fútbol 7")).toBeVisible();
    await expect(tercera.getByText("Con iluminación")).toBeVisible();
    await expect(tercera.getByText("Bancas")).toBeVisible();
  });

  test("si falta un dato o el nombre ya existe, no guarda y dice el problema", async ({ page }) => {
    await abrirCanchas(page);

    await page.getByRole("button", { name: "Una", exact: true }).click();
    await page.getByRole("button", { name: "Agregar cancha" }).click();
    await expect(page.getByText("Elige si es de fútbol 5 o de fútbol 7.")).toBeVisible();
    await expect(page.getByText("Indica si tiene luz para jugar de noche.")).toBeVisible();

    await agregarUna(page, "cancha 1");
    await expect(page.getByText("Ya existe una cancha llamada «cancha 1».")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(3);
  });

  test("edita los datos de una cancha y queda en los cambios recientes", async ({ page }) => {
    const nombre = nombreUnico("La Grande");
    await abrirCanchas(page);
    const inicial = nombreUnico("Por editar");
    await agregarUna(page, inicial);
    const creada = ficha(page, inicial);

    await creada.getByRole("button", { name: "Editar" }).click();
    await creada.getByLabel(/^Nombre/).fill(nombre);
    await creada.getByRole("button", { name: "Fútbol 7" }).click();
    await creada.getByRole("button", { name: "Con luz" }).click();
    await creada.getByRole("button", { name: "Junto a la pared" }).click();
    await creada.getByLabel(/^Nota para el jugador/).fill("Junto al estacionamiento.");
    await creada.getByRole("button", { name: "Guardar cambios" }).click();

    const editada = ficha(page, nombre);
    await expect(editada.getByText("Fútbol 7")).toBeVisible();
    await expect(editada.getByText("Con iluminación")).toBeVisible();
    await expect(editada.getByText("Junto al estacionamiento.")).toBeVisible();
    await page.reload();
    await page.getByText("Cambios recientes").click();
    await expect(page.getByText(new RegExp(`Valeria León Paredes editó ${nombre}`))).toBeVisible();
  });

  test("desactiva una cancha sin reservas, la reactiva, y elimina una creada por error", async ({ page }) => {
    const nombre = nombreUnico("Por error");
    await abrirCanchas(page);
    await agregarUna(page, nombre);
    const cancha = ficha(page, nombre);

    await cancha.getByRole("button", { name: "Desactivar" }).click();
    await cancha.getByRole("button", { name: "Sí, desactivar" }).click();
    await expect(cancha.getByText("Desactivada")).toBeVisible();
    await page.getByRole("button", { name: /^Desactivadas/ }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await cancha.getByRole("button", { name: "Reactivar" }).click();
    await expect(aviso(page, `${nombre} vuelve a estar operativa.`)).toBeVisible();

    await page.getByRole("button", { name: /^Todas/ }).click();
    await cancha.getByRole("button", { name: "Eliminar" }).click();
    await cancha.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(cancha).toHaveCount(0);
    await page.getByText("Cambios recientes").click();
    await expect(page.getByText(new RegExp(`eliminó ${nombre}`))).toBeVisible();
  });

  test("en pantalla angosta se lee sin desplazamiento horizontal y el alta va después de la lista", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await abrirCanchas(page);

    await expect(page.getByRole("article").first()).toBeVisible();
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde).toBe(0);
    const primeraFicha = await page.getByRole("article").first().boundingBox();
    const alta = await page.getByRole("heading", { name: "Agregar canchas" }).boundingBox();
    expect(primeraFicha!.y).toBeLessThan(alta!.y);
  });
});

test.describe("mantenimiento, en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "Los bloqueos son del local: los crea un solo proyecto.");

  async function abrirMantenimiento(pagina: Page, nombre: string) {
    await abrirCanchas(pagina);
    await agregarUna(pagina, nombre);
    await expect(ficha(pagina, nombre)).toBeVisible();
    await pestana(pagina, "Mantenimiento").click();
    await expect(pagina).toHaveURL("/administracion/canchas/mantenimiento");
  }

  const bloqueos = (pagina: Page) => pagina.getByRole("complementary", { name: "Bloqueos" });

  test("bloquea una cancha en un rango con motivo; se ve en la lista y en su ficha", async ({ page }) => {
    const nombre = nombreUnico("Por bloquear");
    await abrirMantenimiento(page, nombre);

    await page.getByRole("button", { name: /^Bloquear/ }).click();
    await expect(page.getByText("Elige al menos una cancha.")).toBeVisible();
    await expect(page.getByText("Escribe el motivo del bloqueo.")).toBeVisible();
    await page.getByRole("button", { name: nombre }).click();
    await page.getByLabel(/^Motivo/).fill("Peinado del césped.");
    await page.getByRole("button", { name: "Bloquear 1 cancha" }).click();

    await expect(aviso(page, `${nombre} queda en mantenimiento en ese rango.`)).toBeVisible();
    const proximo = bloqueos(page).getByRole("region", { name: "Próximos" }).getByRole("listitem").filter({ hasText: nombre });
    await expect(proximo).toContainText("Peinado del césped.");
    await expect(page.getByRole("button", { name: nombre })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel(/^Motivo/).fill("Otra vez.");
    await page.getByRole("button", { name: "Bloquear 1 cancha" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Ya hay un bloqueo en ese rango." })).toBeVisible();

    await pestana(page, "Canchas").click();
    await expect(ficha(page, nombre).getByText(/Próximo mantenimiento/)).toBeVisible();
  });

  test("una emergencia la pone en mantenimiento ya; al liberarla vuelve a estar operativa", async ({ page }) => {
    const nombre = nombreUnico("Emergencia");
    await abrirMantenimiento(page, nombre);

    await page.getByRole("button", { name: nombre }).click();
    await page.getByRole("button", { name: "Emergencia", exact: true }).click();
    await page.getByRole("button", { name: "Hasta el fin de ese día" }).click();
    await page.getByLabel(/^Motivo/).fill("Se rompió un reflector.");
    await page.getByRole("button", { name: "Bloquear 1 cancha" }).click();

    const enCurso = bloqueos(page).getByRole("region", { name: "En curso" }).getByRole("listitem").filter({ hasText: nombre });
    await expect(enCurso).toBeVisible();
    await pestana(page, "Canchas").click();
    await expect(ficha(page, nombre).getByText("Mantenimiento")).toBeVisible();
    await expect(ficha(page, nombre).getByText(/No se puede reservar hasta/)).toBeVisible();

    await pestana(page, "Mantenimiento").click();
    await enCurso.getByRole("button", { name: "Liberar desde ahora" }).click();
    await enCurso.getByRole("button", { name: "Sí, liberar" }).click();
    await expect(aviso(page, `${nombre} vuelve a estar disponible.`)).toBeVisible();
    await pestana(page, "Canchas").click();
    await expect(ficha(page, nombre).getByText("Operativa")).toBeVisible();
    await page.getByText("Cambios recientes").click();
    await expect(page.getByText(new RegExp(`liberó antes el mantenimiento de ${nombre}`))).toBeVisible();
  });

  test("quita un bloqueo que aún no empieza", async ({ page }) => {
    const nombre = nombreUnico("Por quitar");
    await abrirMantenimiento(page, nombre);
    await page.getByRole("button", { name: nombre }).click();
    await page.getByLabel(/^Motivo/).fill("Fumigación.");
    await page.getByRole("button", { name: "Bloquear 1 cancha" }).click();
    const proximo = bloqueos(page).getByRole("listitem").filter({ hasText: nombre });

    await proximo.getByRole("button", { name: "Quitar bloqueo" }).click();
    await proximo.getByRole("button", { name: "Sí, quitar" }).click();

    await expect(aviso(page, `Se quitó el bloqueo de ${nombre}.`)).toBeVisible();
    await expect(proximo).toHaveCount(0);
  });
});

