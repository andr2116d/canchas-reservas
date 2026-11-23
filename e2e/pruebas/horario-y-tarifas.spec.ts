import { expect, type Locator, type Page, test } from "@playwright/test";
import { unJugadorNuevo } from "../soporte/jugador-de-prueba";
import { entrarComoAdministrador } from "../soporte/recepcionistas-de-prueba";

// El horario y las tarifas son del local entero: las pruebas que guardan van en
// orden y en un solo proyecto; en celular solo se comprueba que la pantalla se usa bien.
test.describe.configure({ mode: "serial" });

const RUTA = "/administracion/horario-y-tarifas";

async function abrirPantalla(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Horario y tarifas" }).first().click();
  await expect(pagina).toHaveURL(RUTA);
}

const dia = (pagina: Page, nombre: string) => pagina.getByRole("group", { name: nombre, exact: true });
const tarjetaDe = (pagina: Page, nombre: string) => pagina.getByRole("region", { name: nombre });

async function ponerHora(grupo: Locator, etiqueta: string, hora: string) {
  const [horas, minutos] = hora.split(":");
  await grupo.getByRole("spinbutton", { name: `Horas de ${etiqueta}` }).fill(horas);
  await grupo.getByRole("spinbutton", { name: `Minutos de ${etiqueta}` }).fill(minutos);
}

async function guardarHorario(pagina: Page) {
  await pagina.getByRole("button", { name: "Guardar horario" }).click();
  await expect(pagina.getByRole("region", { name: "Horario de atención" }).getByRole("status")).toBeVisible();
}

async function escribirTarifa(pagina: Page, nombre: string, valores: { dia: string; noche: string; horas: string }) {
  const tarjeta = tarjetaDe(pagina, nombre);
  await tarjeta.getByLabel(/^Precio de día/).fill(valores.dia);
  await tarjeta.getByLabel(/^Precio de noche/).fill(valores.noche);
  await tarjeta.getByLabel(/^Duración del turno/).fill(valores.horas);
  await tarjeta.getByRole("button", { name: `Guardar tarifa de ${nombre.toLowerCase()}` }).click();
  await expect(tarjeta.getByRole("status")).toBeVisible();
}

test.describe("en escritorio", () => {
  test.skip(({ isMobile }) => isMobile, "El horario es único: lo guarda un solo proyecto.");

  test("define la apertura y el cierre de cada día, cierra el domingo y da al sábado su hora de noche", async ({ page }) => {
    await abrirPantalla(page);
    await ponerHora(dia(page, "Lunes"), "Abre", "08:00");
    await ponerHora(dia(page, "Lunes"), "Cierra", "22:00");
    await dia(page, "Lunes").getByRole("button", { name: "Copiar a los demás días abiertos" }).click();
    await dia(page, "Domingo").getByText("Abierto", { exact: true }).click();
    await dia(page, "Sábado").getByRole("checkbox", { name: /Otra hora de noche/ }).check();
    await ponerHora(dia(page, "Sábado"), "Noche", "17:00");

    await guardarHorario(page);
    await expect(page.getByText(/Horario guardado/)).toBeVisible();
    await page.reload();

    await expect(dia(page, "Viernes").getByRole("spinbutton", { name: "Horas de Cierra" })).toHaveValue("22");
    await expect(dia(page, "Domingo").getByRole("switch")).not.toBeChecked();
    await expect(dia(page, "Sábado").getByRole("spinbutton", { name: "Horas de Noche" })).toHaveValue("17");
    await expect(page.getByText(/Vigente desde .* por Valeria León Paredes/).first()).toBeVisible();
  });

  test("no deja guardar un cierre igual o anterior a la apertura", async ({ page }) => {
    await abrirPantalla(page);
    await ponerHora(dia(page, "Martes"), "Cierra", "07:00");
    await page.getByRole("button", { name: "Guardar horario" }).click();

    await expect(dia(page, "Martes").getByText("El cierre debe ser después de la apertura.")).toBeVisible();
    const respuesta = await page.request.put("/api/horario", {
      data: { inicioDeLaNoche: "18:00", dias: [{ dia: "LUNES", abierto: true, abre: "22:00", cierra: "22:00" }] },
    });
    expect(respuesta.status()).toBe(400);
  });

  test("define el precio de día, el de noche y la duración del turno de un tipo", async ({ page }) => {
    await abrirPantalla(page);

    await escribirTarifa(page, "Fútbol 7", { dia: "50", noche: "100", horas: "3" });

    const tarjeta = tarjetaDe(page, "Fútbol 7");
    await expect(tarjeta.getByRole("status")).toContainText("Rige para las reservas nuevas");
    await page.reload();
    await expect(tarjetaDe(page, "Fútbol 7").getByLabel(/^Precio de noche/)).toHaveValue("100.00");
    await expect(tarjetaDe(page, "Fútbol 7").getByRole("list", { name: "Turnos de cada día" })).toContainText(
      "4 turnos · sin turno de 20:00 a 22:00",
    );
  });

  test("no acepta montos en cero, negativos ni que no son números", async ({ page }) => {
    await abrirPantalla(page);
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
    await abrirPantalla(page);

    await escribirTarifa(page, "Fútbol 5", { dia: "60", noche: "60", horas: "1" });
    await expect(tarjetaDe(page, "Fútbol 5").getByRole("status")).toContainText("Tarifa guardada");
    await escribirTarifa(page, "Fútbol 5", { dia: "60.00", noche: "60", horas: "1" });

    await expect(tarjetaDe(page, "Fútbol 5").getByRole("status")).toContainText("No había cambios");
  });

  test("los turnos del día salen seguidos del horario y la duración, cada uno con su precio", async ({ page }) => {
    await abrirPantalla(page);
    const turnos = page.getByRole("region", { name: "Turnos del día" });

    await turnos.getByText("Fútbol 7", { exact: true }).click();
    await expect(turnos.getByRole("listitem")).toHaveCount(4);
    await expect(turnos.getByRole("listitem").nth(3)).toContainText("17:00 a 20:00");
    await expect(turnos.getByRole("listitem").nth(3)).toContainText("S/ 83.33");
    await expect(turnos.getByText("De 20:00 a 22:00 no se ofrece turno.")).toBeVisible();

    await turnos.getByText("Dom", { exact: true }).click();
    await expect(turnos.getByText("Ese día el local no abre.")).toBeVisible();
    await turnos.getByText("Sáb", { exact: true }).click();
    await expect(turnos.getByText("La noche empieza a las 17:00.")).toBeVisible();
  });

  test("el rato final se puede ofrecer como turno corto cobrado en proporción", async ({ page }) => {
    await abrirPantalla(page);
    const tarjeta = tarjetaDe(page, "Fútbol 7");

    await tarjeta.getByRole("radio", { name: /Ofrecerlo como turno corto/ }).check();
    await expect(tarjeta.getByRole("list", { name: "Turnos de cada día" })).toContainText("4 turnos + 1 corto de 20:00 a 22:00");
    await tarjeta.getByRole("button", { name: "Guardar tarifa de fútbol 7" }).click();
    await expect(tarjeta.getByRole("status")).toContainText("Tarifa guardada");

    const turnos = page.getByRole("region", { name: "Turnos del día" });
    await turnos.getByText("Fútbol 7", { exact: true }).click();
    const corto = turnos.getByRole("listitem").filter({ hasText: "Turno corto" });
    await expect(corto).toContainText("20:00 a 22:00");
    await expect(corto).toContainText("S/ 66.67");
  });

  test("cada cambio de tarifa queda en las anteriores con quién y cuándo", async ({ page }) => {
    await abrirPantalla(page);
    const tarjeta = tarjetaDe(page, "Fútbol 7");

    await tarjeta.getByText(/^Tarifas anteriores/).click();

    await expect(tarjeta.getByText("Día S/ 50.00 · Noche S/ 100.00 · Turno de 3 horas")).toBeVisible();
  });
});

test("en celular el horario se edita sin desbordar la pantalla", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Solo para la vista de celular.");
  await abrirPantalla(page);

  const horas = dia(page, "Lunes").getByRole("spinbutton", { name: "Horas de Cierra" });
  const antes = Number(await horas.inputValue());
  await dia(page, "Lunes").getByRole("button", { name: "Subir horas de Cierra" }).click();

  await expect(horas).toHaveValue(String((antes + 1) % 25).padStart(2, "0"));
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
