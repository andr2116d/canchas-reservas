import { expect, type Page, test } from "@playwright/test";
import { type JugadorDePrueba, unJugadorNuevo } from "../soporte/jugador-de-prueba";

// La etiqueta visible termina en asterisco; se busca por su comienzo.
const campo = (pagina: Page, nombre: string) => pagina.getByLabel(new RegExp(`^${nombre}`));

async function llenarRegistro(pagina: Page, jugador: JugadorDePrueba) {
  await campo(pagina, "Nombres").fill(jugador.nombres);
  await campo(pagina, "Apellidos").fill(jugador.apellidos);
  await campo(pagina, "Fecha de nacimiento").fill(jugador.fechaNacimiento);
  await campo(pagina, "Número de documento").fill(jugador.numeroDocumento);
  await campo(pagina, "Celular").fill(jugador.celular);
  await campo(pagina, "Correo").fill(jugador.correo);
  await campo(pagina, "Contraseña").fill(jugador.contrasena);
}

async function registrar(pagina: Page, jugador: JugadorDePrueba) {
  await pagina.goto("/registro");
  await llenarRegistro(pagina, jugador);
  await pagina.getByRole("button", { name: "Crear mi cuenta" }).click();
}

test.describe("Registro de jugador", () => {
  test("crea la cuenta, deja la sesión iniciada y lleva al inicio", async ({ page }) => {
    await registrar(page, unJugadorNuevo());

    await expect(page).toHaveURL("/inicio");
    await expect(page.getByRole("heading", { name: "Hola, Valeria." })).toBeVisible();
  });

  test("vuelve a la reserva pendiente si llegó desde ese flujo", async ({ page }) => {
    await page.goto("/registro?siguiente=/reservar/la-popular");
    await llenarRegistro(page, unJugadorNuevo());

    await page.getByRole("button", { name: "Crear mi cuenta" }).click();

    await expect(page).toHaveURL("/reservar/la-popular");
  });

  test("avisa mientras se escribe, sin presionar el botón", async ({ page }) => {
    await page.goto("/registro");

    await campo(page, "Número de documento").pressSequentially("4567");
    await campo(page, "Celular").pressSequentially("044123456");

    await expect(campo(page, "Número de documento")).toHaveAccessibleDescription(
      "El DNI debe tener 8 dígitos.",
    );
    await expect(campo(page, "Celular")).toHaveAccessibleDescription(
      "El celular debe empezar con 9.",
    );
  });

  test("con DNI, en el celular y en el dorsal solo entran números, hasta 8, 9 y 2", async ({ page }) => {
    await page.goto("/registro");

    await campo(page, "Número de documento").pressSequentially("45A67B891234");
    await campo(page, "Celular").pressSequentially("98a76 54-3210");
    await campo(page, "Dorsal").pressSequentially("1O a 234");

    await expect(campo(page, "Número de documento")).toHaveValue("45678912");
    await expect(campo(page, "Celular")).toHaveValue("987654321");
    await expect(campo(page, "Dorsal")).toHaveValue("12");
  });

  test("con carné entran hasta 12 letras o números, y al volver a DNI se vacía", async ({ page }) => {
    await page.goto("/registro");
    await page.getByText("Carné de extranjería").click();

    await campo(page, "Número de documento").pressSequentially("ab-1234567890123");
    await expect(campo(page, "Número de documento")).toHaveValue("AB1234567890");

    await page.getByText("DNI", { exact: true }).click();
    await expect(campo(page, "Número de documento")).toHaveValue("");
  });

  test("no deja crear la cuenta a un menor de 18 años", async ({ page }) => {
    await registrar(page, { ...unJugadorNuevo(), fechaNacimiento: "2012-03-10" });

    await expect(campo(page, "Fecha de nacimiento")).toHaveAccessibleDescription(
      "Debes tener al menos 18 años para crear tu cuenta.",
    );
    await expect(page).toHaveURL("/registro");
  });

  test("informa junto al campo que el documento ya tiene cuenta", async ({ page, browser }) => {
    const titular = unJugadorNuevo();
    await registrar(page, titular);
    await expect(page).toHaveURL("/inicio");
    const otraPersona = await (await browser.newContext()).newPage();

    await registrar(otraPersona, { ...unJugadorNuevo(), numeroDocumento: titular.numeroDocumento });

    await expect(campo(otraPersona, "Número de documento")).toHaveAccessibleDescription(
      "Ya existe una cuenta con este documento.",
    );
    await expect(otraPersona).toHaveURL("/registro");
  });

  test("informa junto al campo que el correo ya tiene cuenta", async ({ page, browser }) => {
    const titular = unJugadorNuevo();
    await registrar(page, titular);
    await expect(page).toHaveURL("/inicio");
    const otraPersona = await (await browser.newContext()).newPage();

    await registrar(otraPersona, { ...unJugadorNuevo(), correo: titular.correo.toUpperCase() });

    await expect(campo(otraPersona, "Correo")).toHaveAccessibleDescription(
      "Ya existe una cuenta con este correo.",
    );
  });

  test("indica qué tan segura es la contraseña mientras se escribe", async ({ page }) => {
    await page.goto("/registro");

    await campo(page, "Contraseña").fill("123456789a");
    await expect(page.getByRole("status")).toContainText("Seguridad de la contraseña: Débil");

    await campo(page, "Contraseña").fill("Tq7#vR2!mZp9$Lw4");
    await expect(page.getByRole("status")).toContainText("Seguridad de la contraseña: Muy buena");
  });

  test("sin sesión, el inicio lleva a crear la cuenta", async ({ page }) => {
    await page.goto("/inicio");

    await expect(page).toHaveURL("/registro");
  });

  test("la sesión no es accesible desde JavaScript", async ({ page, context }) => {
    await registrar(page, unJugadorNuevo());
    await expect(page).toHaveURL("/inicio");

    const [cookie] = (await context.cookies()).filter(({ name }) => name === "sesion");

    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Lax");
    expect(await page.evaluate(() => document.cookie)).not.toContain("sesion=");
  });
});
