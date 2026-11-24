import { expect, type Locator, type Page, test } from "@playwright/test";
import { unJugadorNuevo } from "../../soporte/jugador-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// El horario y las tarifas son del local entero: las pruebas que guardan van en
// orden y en un solo proyecto; en celular solo se comprueba que la pantalla se usa bien.
test.describe.configure({ mode: "serial" });

const RUTA = "/administracion/reglas-de-reserva";

async function abrirPantalla(pagina: Page, pestana: "Horario" | "Tarifas" | "Cancelación" = "Horario") {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Reglas de reserva" }).first().click();
  await expect(pagina).toHaveURL(RUTA);
  await pagina.getByRole("tab", { name: pestana }).click();
}

const horario = (pagina: Page) => pagina.getByRole("region", { name: "Horario de atención" });
const tarjetaDe = (pagina: Page, nombre: string) => pagina.getByRole("region", { name: nombre, exact: true });
const vistaPrevia = (pagina: Page) => pagina.getByRole("region", { name: "Turnos del día" });

async function ponerHora(zona: Locator, etiqueta: string, hora: string) {
  const [horas, minutos] = hora.split(":");
  await zona.getByRole("spinbutton", { name: `Horas de ${etiqueta}` }).first().fill(horas);
  await zona.getByRole("spinbutton", { name: `Minutos de ${etiqueta}` }).first().fill(minutos);
}

async function ponerDuracion(tarjeta: Locator, horas: number) {
  const grupo = tarjeta.getByRole("group", { name: "Cada turno dura" });
  for (let intento = 0; intento < 12; intento++) {
    const actual = Number((await grupo.textContent())?.match(/\d+/)?.[0] ?? 0);
    if (actual === horas) return;
    await grupo.getByRole("button", { name: actual < horas ? "Una hora más" : "Una hora menos" }).click();
  }
}

async function escribirTarifa(pagina: Page, nombre: string, valores: { dia: string; noche: string; horas: number }) {
  const tarjeta = tarjetaDe(pagina, nombre);
  await tarjeta.getByLabel(/^Precio de día/).fill(valores.dia);
  await tarjeta.getByLabel(/^Precio de noche/).fill(valores.noche);
  await ponerDuracion(tarjeta, valores.horas);
  await tarjeta.getByRole("button", { name: `Guardar tarifa de ${nombre.toLowerCase()}` }).click();
  await expect(tarjeta.getByRole("status")).toBeVisible();
}

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "El horario es único: lo guarda un solo proyecto.");

  test("define un horario para los días que abre, cierra el domingo y da al sábado su hora de noche", async ({ page }) => {
    await abrirPantalla(page);
    await ponerHora(horario(page), "Abre", "08:00");
    await ponerHora(horario(page), "Cierra", "22:00");
    await page.getByRole("button", { name: "Abre el domingo" }).click();
    await page.getByRole("button", { name: "¿Algún día abre a otra hora?" }).click();
    await page.getByRole("button", { name: "Sáb", exact: true }).click();
    await ponerHora(page.getByRole("group", { name: "Sábado" }), "Noche desde", "17:00");

    await horario(page).getByRole("button", { name: "Guardar horario" }).click();
    await expect(horario(page).getByRole("status")).toContainText("las reservas ya hechas no cambian");
    await page.reload();

    await expect(page.getByRole("button", { name: "Abre el domingo" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("group", { name: "Sábado" }).getByRole("spinbutton", { name: "Horas de Noche desde" })).toHaveValue("17");
    await expect(horario(page).getByText(/Vigente desde .* por Valeria León Paredes/)).toBeVisible();
  });

  test("no deja guardar un cierre igual o anterior a la apertura", async ({ page }) => {
    await abrirPantalla(page);
    await ponerHora(horario(page), "Cierra", "07:00");
    await horario(page).getByRole("button", { name: "Guardar horario" }).click();

    await expect(horario(page).getByText("El cierre debe ser después de la apertura.")).toBeVisible();
    const respuesta = await page.request.put("/api/horario", {
      data: { inicioDeLaNoche: "18:00", dias: [{ dia: "LUNES", abierto: true, abre: "22:00", cierra: "22:00" }] },
    });
    expect(respuesta.status()).toBe(400);
  });

  test("define el precio de día, el de noche y la duración del turno de un tipo", async ({ page }) => {
    await abrirPantalla(page, "Tarifas");

    await escribirTarifa(page, "Fútbol 7", { dia: "50", noche: "100", horas: 3 });

    await expect(tarjetaDe(page, "Fútbol 7").getByRole("status")).toContainText("las reservas ya hechas mantienen su precio");
    await page.reload();
    await page.getByRole("tab", { name: "Tarifas" }).click();
    const tarjeta = tarjetaDe(page, "Fútbol 7");
    await expect(tarjeta.getByLabel(/^Precio de noche/)).toHaveValue("100.00");
    await expect(tarjeta.getByRole("listitem", { name: "Lunes: 4 turnos; de 20:00 a 22:00 sin turno" })).toBeVisible();
  });

  test("no acepta montos en cero, negativos ni que no son números", async ({ page }) => {
    await abrirPantalla(page, "Tarifas");
    const tarjeta = tarjetaDe(page, "Fútbol 5");

    await tarjeta.getByLabel(/^Precio de día/).pressSequentially("-a5b0");
    await expect(tarjeta.getByLabel(/^Precio de día/)).toHaveValue("50");
    await tarjeta.getByLabel(/^Precio de noche/).fill("0");
    await tarjeta.getByRole("button", { name: /^Guardar tarifa/ }).click();
    await expect(tarjeta.getByText("El monto debe ser mayor que cero.")).toBeVisible();

    const respuesta = await page.request.put("/api/tarifas/FUTBOL_5", {
      data: { precioDia: "-5", precioNoche: "cien", duracionDelTurno: "3", ofreceTurnoCorto: false },
    });
    expect(respuesta.status()).toBe(400);
  });

  test("permite el mismo precio de día y de noche, y guardar sin cambios no crea otra versión", async ({ page }) => {
    await abrirPantalla(page, "Tarifas");

    await escribirTarifa(page, "Fútbol 5", { dia: "60", noche: "60", horas: 1 });
    await expect(tarjetaDe(page, "Fútbol 5").getByRole("status")).toContainText("Tarifa guardada");
    await escribirTarifa(page, "Fútbol 5", { dia: "60.00", noche: "60", horas: 1 });

    await expect(tarjetaDe(page, "Fútbol 5").getByRole("status")).toContainText("No había cambios");
  });

  test("la vista previa muestra los turnos seguidos del horario y la duración, cada uno con su precio", async ({ page }) => {
    await abrirPantalla(page);
    const previa = vistaPrevia(page);

    await previa.getByRole("button", { name: "Fútbol 7" }).click();
    await expect(previa.getByRole("listitem")).toHaveCount(4);
    await expect(previa.getByRole("listitem").nth(3)).toContainText("17:00 a 20:00");
    await expect(previa.getByRole("listitem").nth(3)).toContainText("S/ 83.33");
    await expect(previa.getByText("De 20:00 a 22:00 no se ofrece turno: no alcanza para uno completo.")).toBeVisible();

    await previa.getByRole("button", { name: "Domingo" }).click();
    await expect(previa.getByText("El domingo el local no abre.")).toBeVisible();
    await previa.getByRole("button", { name: "Sábado" }).click();
    await expect(previa.getByText(/precio de noche desde las 17:00/)).toBeVisible();
  });

  test("el rato final se puede ofrecer como turno corto, y la vista previa lo muestra antes de guardar", async ({ page }) => {
    await abrirPantalla(page, "Tarifas");
    const tarjeta = tarjetaDe(page, "Fútbol 7");
    const previa = vistaPrevia(page);
    await previa.getByRole("button", { name: "Fútbol 7" }).click();

    await tarjeta.getByRole("radio", { name: /Se ofrece como turno corto/ }).check();
    const corto = previa.getByRole("listitem").filter({ hasText: "Turno corto" });
    await expect(corto).toContainText("20:00 a 22:00");
    await expect(corto).toContainText("S/ 66.67");

    await tarjeta.getByRole("button", { name: "Guardar tarifa de fútbol 7" }).click();
    await expect(tarjeta.getByRole("status")).toContainText("Tarifa guardada");
  });

  test("cada cambio de tarifa queda en las anteriores con quién y cuándo", async ({ page }) => {
    await abrirPantalla(page, "Tarifas");
    const tarjeta = tarjetaDe(page, "Fútbol 7");

    await tarjeta.getByText(/^Tarifas anteriores/).click();

    await expect(tarjeta.getByText("Día S/ 50.00 · Noche S/ 100.00 · Turno de 3 horas")).toBeVisible();
  });
});

test("en celular las secciones van en pestañas y nada se sale de la pantalla", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Solo para la vista de celular.");
  await abrirPantalla(page);

  const horas = horario(page).getByRole("spinbutton", { name: "Horas de Cierra" }).first();
  const antes = Number(await horas.inputValue());
  await horario(page).getByRole("button", { name: "Subir horas de Cierra" }).first().click();
  await expect(horas).toHaveValue(String((antes + 1) % 25).padStart(2, "0"));

  await page.getByRole("tab", { name: "Turnos" }).click();
  await expect(vistaPrevia(page)).toBeVisible();
  await expect(horario(page)).toBeHidden();
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(desborde).toBeLessThanOrEqual(0);
});

test("solo administración define el horario y las tarifas", async ({ page }) => {
  const jugador = unJugadorNuevo();
  await page.request.post("/api/jugadores", {
    data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: "registro-1" },
  });

  expect((await page.request.put("/api/horario", { data: {} })).status()).toBe(403);
  expect((await page.request.put("/api/tarifas/FUTBOL_7", { data: {} })).status()).toBe(403);
  await page.goto(RUTA);
  await expect(page.getByRole("heading", { name: "Esta zona no es para tu cuenta" })).toBeVisible();
});
