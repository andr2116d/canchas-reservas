import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";
import { datosDeReserva, ponerPorValidarVencida, vencerEn, vencerReserva } from "../../soporte/base-de-pruebas";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { type CanchasDelLocal, fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { abrirElDia, celda } from "../../soporte/mapa-de-prueba";
import { separarPorApi, type TurnoDePrueba } from "../../soporte/reserva-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// Cambia el plazo para pagar, que es del local entero: corre en orden, después de las reservas.
test.describe.configure({ mode: "serial" });

const REGLA = { rangos: [{ desdeHoras: "24", porcentaje: "100", ofreceCredito: true }, { desdeHoras: "0", porcentaje: "0", ofreceCredito: false }] };
const UN_MINUTO_Y_MEDIO = 90_000;

let canchas: CanchasDelLocal;
let fecha: string;
let administracion: BrowserContext;

const turno = (cancha: keyof CanchasDelLocal, desde: string, dia = fecha): TurnoDePrueba => ({ canchaId: canchas[cancha], fecha: dia, desde });
const guardarPlazo = async (minutos: string) => expect((await administracion.request.put("/api/plazo-de-pago", { data: { minutos } })).ok()).toBe(true);
const soloUnaVez = (isMobile: boolean) => test.skip(isMobile, "El plazo es del local: lo cambia un solo proyecto.");

/** Un jugador nuevo, en su propio contexto, con una reserva separada en ese turno. */
async function unaReservaDe(navegador: Browser, elegido: TurnoDePrueba) {
  const contexto = await navegador.newContext();
  await registrarPorApi(contexto.request);
  return { contexto, codigo: await separarPorApi(contexto.request, elegido) };
}

/** Espera a que la tarea de cada minuto pase la reserva a expirada. */
async function esperarExpirada(codigo: string) {
  await expect.poll(async () => (await datosDeReserva(codigo)).estado, { timeout: UN_MINUTO_Y_MEDIO, intervals: [2_000] }).toBe("expirada");
}

const tarjetaDelPlazo = (pagina: Page) => pagina.getByRole("region", { name: "Plazo para pagar el adelanto" });

test.beforeAll(async ({ browser }, informacion) => {
  canchas = await prepararElLocal(browser);
  fecha = fechaDeLima(informacion.project.name.includes("celular") ? 8 : 7);
  administracion = await browser.newContext();
  await entrarComoAdministrador(await administracion.newPage());
  expect((await administracion.request.put("/api/cancelacion/regla", { data: REGLA })).ok()).toBe(true);
});

test.afterAll(() => administracion.close());

test("administración define el plazo en minutos de 1 a 1440 y lo que no cumple no se guarda", async ({ isMobile }) => {
  soloUnaVez(isMobile);
  const pagina = await administracion.newPage();
  await pagina.goto("/administracion/reglas-de-reserva");
  await pagina.getByRole("tab", { name: "Tarifas" }).click();
  const campo = tarjetaDelPlazo(pagina).getByLabel(/^Minutos para pagar/);

  for (const malo of ["0", "1441"]) {
    await campo.fill(malo);
    await tarjetaDelPlazo(pagina).getByRole("button", { name: "Guardar plazo" }).click();
    await expect(tarjetaDelPlazo(pagina).getByText("Usa un número entero de minutos, de 1 a 1440.")).toBeVisible();
  }
  const rechazo = await administracion.request.put("/api/plazo-de-pago", { data: { minutos: "1441" } });
  expect(rechazo.status()).toBe(400);
  expect((await rechazo.json()).errores.minutos).toBe("Usa un número entero de minutos, de 1 a 1440.");
  await campo.fill("30");
  await tarjetaDelPlazo(pagina).getByRole("button", { name: "Guardar plazo" }).click();
  await expect(tarjetaDelPlazo(pagina).getByRole("status")).toHaveText("Plazo guardado. Rige para las reservas nuevas; las ya separadas vencen a su hora.");
  await pagina.close();
});

test("cada guardado es una versión que entra al historial, y guardar lo mismo no crea otra", async ({ isMobile }) => {
  soloUnaVez(isMobile);
  const pagina = await administracion.newPage();
  await pagina.goto("/administracion/reglas-de-reserva");
  await pagina.getByRole("tab", { name: "Tarifas" }).click();

  await tarjetaDelPlazo(pagina).getByRole("button", { name: "Guardar plazo" }).click();

  await expect(tarjetaDelPlazo(pagina).getByRole("status")).toHaveText("No había cambios: el plazo sigue igual.");
  await expect(tarjetaDelPlazo(pagina).getByText(/Vigente desde .* por Valeria León Paredes/)).toBeVisible();
  await pagina.goto("/administracion/historial?categoria=PLAZO_DE_PAGO");
  await expect(pagina.getByText(/(definió|cambió) el plazo para pagar el adelanto/)).toHaveCount(1);
  await pagina.close();
});

test("un cambio del plazo rige solo para las reservas nuevas", async ({ browser, isMobile }) => {
  soloUnaVez(isMobile);
  await guardarPlazo("20");
  const anterior = await unaReservaDe(browser, turno("Disp Uno", "08:30"));

  await guardarPlazo("40");
  const nueva = await unaReservaDe(browser, turno("Disp Uno", "09:30"));

  expect((await datosDeReserva(anterior.codigo)).minutosDeRetencion).toBe(20);
  expect((await datosDeReserva(nueva.codigo)).minutosDeRetencion).toBe(40);
  await guardarPlazo("15");
});

test("vence al acabar el plazo o al empezar el turno, lo que llegue antes", async ({ browser, isMobile }) => {
  soloUnaVez(isMobile);
  const horaEnLima = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  test.skip(horaEnLima < 1, "Antes de la 1:00 no hay un turno de mañana que empiece antes de 24 horas.");
  // Un turno de mañana a una hora que ya pasó hoy empieza antes de que se cumplan 24 horas.
  const desde = `${String(Math.min(horaEnLima - 1, 22)).padStart(2, "0")}:30`;
  await guardarPlazo("1440");

  // Mañana, Disp Uno tiene reservas y un bloqueo de la disponibilidad entre las 08:30 y las 11:30.
  const cancha = desde >= "08:30" && desde <= "10:30" ? "Disp Dos" : "Disp Uno";
  const reserva = await unaReservaDe(browser, turno(cancha, desde, fechaDeLima(1)));

  expect((await datosDeReserva(reserva.codigo)).minutosDeRetencion).toBeLessThan(1440);
  await guardarPlazo("15");
});

test("al vencer, el turno se ve libre en el mapa abierto, sin recargar ni esperar ninguna tarea", async ({ page, browser }) => {
  const reserva = await unaReservaDe(browser, turno("Disp Uno", "10:30"));
  await abrirElDia(page, fecha);
  await expect(celda(page, "Disp Uno", "10:30")).toHaveText("Pendiente");

  await vencerEn(reserva.codigo, 4);

  await expect(celda(page, "Disp Uno", "10:30")).toHaveText("Libre", { timeout: 15_000 });
});

test("en el minuto siguiente al vencimiento pasa a expirada y queda en el historial hecha por «Sistema»", async ({ browser, isMobile }) => {
  soloUnaVez(isMobile);
  test.setTimeout(150_000);
  const reserva = await unaReservaDe(browser, turno("Disp Uno", "11:30"));

  await vencerReserva(reserva.codigo);

  await esperarExpirada(reserva.codigo);
  const pagina = await administracion.newPage();
  await pagina.goto("/administracion/historial?categoria=RESERVAS");
  await expect(pagina.getByRole("listitem").filter({ hasText: `Sistema dio por vencida la Reserva ${reserva.codigo}` })).toBeVisible();
  await pagina.close();
});

test("quien separa el turno de una reserva vencida la expira en la misma operación", async ({ browser }) => {
  const vencida = await unaReservaDe(browser, turno("Disp Uno", "12:30"));
  await vencerReserva(vencida.codigo);

  await unaReservaDe(browser, turno("Disp Uno", "12:30"));

  expect((await datosDeReserva(vencida.codigo)).estado).toBe("expirada");
});

test("una reserva con el pago por validar no vence aunque pase el plazo", async ({ browser, isMobile }) => {
  soloUnaVez(isMobile);
  test.setTimeout(150_000);
  const porValidar = await unaReservaDe(browser, turno("Disp Dos", "13:30"));
  const vencida = await unaReservaDe(browser, turno("Disp Uno", "13:30"));
  await ponerPorValidarVencida(porValidar.codigo);
  await vencerReserva(vencida.codigo);

  // Cuando la tarea ya expiró la otra, también pasó por esta.
  await esperarExpirada(vencida.codigo);

  expect((await datosDeReserva(porValidar.codigo)).estado).toBe("pendiente_de_validacion");
});

test.fixme("un pago que llega después del vencimiento no se acepta", () => {
  // Llega con el pago del adelanto en línea: hoy no hay forma de pagar.
});

test("una reserva expirada no se reactiva: se ofrece separar otro turno", async ({ browser }) => {
  const reserva = await unaReservaDe(browser, turno("Disp Uno", "14:30"));
  await vencerReserva(reserva.codigo);
  const pagina = await reserva.contexto.newPage();

  await pagina.goto(`/inicio/mis-reservas/${reserva.codigo}`);

  await expect(pagina.getByRole("heading", { name: "La reserva venció" })).toBeVisible();
  await expect(pagina.getByRole("button", { name: /^Pagar/ })).toHaveCount(0);
  await pagina.getByRole("region", { name: "La reserva venció" }).getByRole("link", { name: "Reservar otro turno" }).click();
  await expect(pagina).toHaveURL("/inicio/reservar");
});

test("la cuenta regresiva usa la hora del server aunque el dispositivo tenga otra", async ({ browser }) => {
  const reserva = await unaReservaDe(browser, turno("Disp Uno", "15:30"));
  const pagina = await reserva.contexto.newPage();
  // El reloj del dispositivo va tres horas adelantado.
  await pagina.clock.setSystemTime(new Date(Date.now() + 3 * 60 * 60 * 1000));

  await pagina.goto(`/inicio/mis-reservas/${reserva.codigo}`);

  await expect(pagina.getByRole("timer", { name: "Tiempo que queda" })).toHaveText(/^1[45]:\d{2}$/);
});

test.fixme("recepción ve cuánto falta para que venza una reserva que creó en el local", () => {
  // Llega con las reservas que crea recepción.
});

test("cuando su reserva vence, al jugador le llega «Tu reserva venció» en la campana", async ({ browser }) => {
  const reserva = await unaReservaDe(browser, turno("Disp Uno", "16:30"));
  const pagina = await reserva.contexto.newPage();
  await pagina.goto("/inicio");
  await vencerReserva(reserva.codigo);

  await unaReservaDe(browser, turno("Disp Uno", "16:30"));

  await pagina.getByRole("button", { name: /^Avisos, \d+ sin leer/ }).click({ timeout: 10_000 });
  await expect(pagina.getByRole("link", { name: new RegExp(`^Tu reserva ${reserva.codigo} venció`) })).toBeVisible();
});
