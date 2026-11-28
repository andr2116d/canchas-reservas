import { type Browser, expect, type Page, test } from "@playwright/test";
import { guardarReserva } from "../../soporte/base-de-pruebas";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { type CanchasDelLocal, fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { celda, fila, mapa, tuTurno } from "../../soporte/mapa-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// Esta prueba es dueña del horario, las tarifas y las canchas «Disp»: corre al final y en orden.
test.describe.configure({ mode: "serial" });

const MANANA = fechaDeLima(1);
let canchas: CanchasDelLocal;

async function comoAdministrador(navegador: Browser, trabajo: (admin: Page) => Promise<void>) {
  const contexto = await navegador.newContext();
  const admin = await contexto.newPage();
  await entrarComoAdministrador(admin);
  await trabajo(admin);
  await contexto.close();
}

async function bloquear(admin: Page, canchaId: number, desde: string, hasta: string) {
  const respuesta = await admin.request.post("/api/bloqueos", {
    data: { canchaIds: [canchaId], tipo: "PROGRAMADO", desdeAhora: false, desdeFecha: MANANA, desdeHora: desde, hastaFecha: MANANA, hastaHora: hasta, motivo: "Cambio de redes" },
  });
  // Al repetir la prueba en otro proyecto, el bloqueo ya existe.
  expect([201, 409]).toContain(respuesta.status());
}

test.beforeAll(async ({ browser }) => {
  canchas = await prepararElLocal(browser);
  await guardarReserva(canchas["Disp Uno"], MANANA, "08:30", "pendiente_de_validacion");
  await guardarReserva(canchas["Disp Uno"], MANANA, "09:30", "confirmada");
  await comoAdministrador(browser, (admin) => bloquear(admin, canchas["Disp Uno"], "10:30", "11:30"));
});


async function abrirManana(pagina: Page, ruta = "/") {
  await pagina.goto(ruta);
  await pagina.getByRole("button", { name: /^\S+, \d+ de \S+$/ }).nth(1).click();
  await expect(fila(pagina, "08:30")).toBeVisible({ timeout: 15_000 });
}

test("cualquiera, sin iniciar sesión, elige una fecha y ve las canchas activas con los turnos del día", async ({ page }) => {
  await abrirManana(page);

  await expect(mapa(page).getByRole("columnheader", { name: /Disp Uno/ })).toContainText("Con luz");
  await expect(mapa(page).getByRole("columnheader", { name: /Disp Dos/ })).toContainText("Solo luz natural");
  await expect(fila(page, "00:30")).toBeVisible();
  await expect(fila(page, "22:30")).toBeVisible();
});

test("cada turno se ve libre, pendiente, ocupado o en mantenimiento, sin decir de quién ni por qué", async ({ page }) => {
  await abrirManana(page);

  await expect(celda(page, "Disp Uno", "08:30")).toHaveText("Pendiente");
  await expect(celda(page, "Disp Uno", "09:30")).toHaveText("Ocupado");
  await expect(celda(page, "Disp Uno", "10:30")).toHaveText("Mantenimiento");
  await expect(celda(page, "Disp Uno", "11:30")).toHaveText("Libre");
  await expect(page.getByText(/validación|Cambio de redes|Valeria/)).toHaveCount(0);
});

test("cada turno libre muestra su precio y el adelanto mínimo", async ({ page }) => {
  await abrirManana(page);

  await expect(fila(page, "19:30")).toContainText("S/ 80.00");
  await expect(fila(page, "19:30")).toContainText("Adelanto S/ 40.00");
  await celda(page, "Disp Uno", "19:30").click();
  await expect(tuTurno(page)).toContainText("Lo separas con S/ 40.00 de adelanto (50 %)");
});

test("no muestra canchas desactivadas ni turnos fuera del horario", async ({ page }) => {
  await abrirManana(page);

  await expect(mapa(page).getByRole("columnheader", { name: /Disp Apagada/ })).toHaveCount(0);
  await expect(mapa(page).getByRole("rowheader", { name: /^(00:00|23:30)/ })).toHaveCount(0);
});

test("un tipo de cancha sin tarifa no deja elegir sus turnos y dice por qué", async ({ page }) => {
  await abrirManana(page);

  await page.getByRole("tab", { name: /^Fútbol 7/ }).click();

  await expect(page.getByText("Fútbol 7 todavía no tiene precio: sus turnos aún no se pueden reservar.")).toBeVisible();
});

test("no deja elegir turnos que ya empezaron ni fechas anteriores a hoy", async ({ page }) => {
  const minutosEnLima = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "numeric", hourCycle: "h23" }).format(new Date())) * 60;
  test.skip(minutosEnLima < 60, "Antes de la 1:00 todavía no empezó ningún turno del día.");
  await page.goto("/");

  await page.getByRole("button", { name: /turnos? que ya empez/ }).click();

  await expect(celda(page, "Disp Uno", "00:30")).toHaveText("Ya empezó");
  await expect(mapa(page).getByRole("button", { name: /Disp Uno, de 00:30/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Días anteriores" })).toBeDisabled();
  expect((await page.request.get(`/api/disponibilidad?fecha=${fechaDeLima(-1)}`)).status()).toBe(400);
});

test("solo se pueden consultar fechas hasta 30 días hacia adelante", async ({ page }) => {
  await page.goto("/");
  const siguientes = page.getByRole("button", { name: "Días siguientes" });

  while (await siguientes.isEnabled()) await siguientes.click();

  await expect(page.getByRole("group", { name: "Fecha" }).getByRole("button").filter({ hasText: String(Number(fechaDeLima(30).slice(8))) }).last()).toBeVisible();
  const lejos = await page.request.get(`/api/disponibilidad?fecha=${fechaDeLima(31)}`);
  expect(lejos.status()).toBe(400);
  expect((await lejos.json()).errores.fecha).toBe("Solo se pueden consultar los próximos 30 días.");
});

test("el mapa se actualiza sin recargar en menos de 10 segundos", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "El cambio lo hace administración una sola vez.");
  await abrirManana(page);
  await expect(celda(page, "Disp Dos", "14:30")).toHaveText("Libre");

  await comoAdministrador(browser, (admin) => bloquear(admin, canchas["Disp Dos"], "14:30", "15:30"));

  await expect(celda(page, "Disp Dos", "14:30")).toHaveText("Mantenimiento", { timeout: 10_000 });
});

test("en el celular se ve y se usa sin salirse de la pantalla", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Solo en celular.");
  await abrirManana(page);

  const [ancho, visible] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(ancho).toBeLessThanOrEqual(visible);
  await celda(page, "Disp Uno", "12:30").click();
  await expect(tuTurno(page)).toBeInViewport();
  await tuTurno(page).getByRole("button", { name: "Cerrar" }).click();
  await expect(tuTurno(page)).toBeHidden();
});

test("el jugador mira los turnos desde su panel y la portada lo lleva a él", async ({ page }) => {
  await registrarPorApi(page.request);

  await page.goto("/");
  await page.getByRole("link", { name: "Ir a mi panel" }).click();
  await expect(page).toHaveURL("/inicio");
  await abrirManana(page, "/inicio/reservar");
  await celda(page, "Disp Uno", "19:30").click();

  await expect(tuTurno(page).getByRole("link", { name: "Ingresar para reservar" })).toHaveCount(0);
});
