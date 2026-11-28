import { type Browser, expect, type Page, test } from "@playwright/test";
import { cambiarEstadoDeReserva, vencerReserva } from "../../soporte/base-de-pruebas";
import { unJugadorNuevo, VERSION_LEGAL_DEL_REGISTRO } from "../../soporte/jugador-de-prueba";
import { type CanchasDelLocal, fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { correoDe, crearPorApi } from "../../soporte/recepcionistas-de-prueba";
import { cerrarSesion, confirmarMisDatos, entrarComoAdministrador, iniciarSesion } from "../../soporte/sesiones-de-prueba";

// Usa el horario, las tarifas y las canchas «Disp» de la disponibilidad: corre después y en orden.
test.describe.configure({ mode: "serial" });

const DIA_LARGO = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const diaLargo = (fecha: string) => DIA_LARGO.format(new Date(`${fecha}T00:00:00Z`));

let canchas: CanchasDelLocal;
let fecha: string;

/** Un jugador nuevo separa el turno (S/ 60 de día o S/ 80 de noche, con 50 % de adelanto) y devuelve el código y su celular. */
async function separarTurno(navegador: Browser, cancha: number, desde: string) {
  const contexto = await navegador.newContext();
  const pagina = await contexto.newPage();
  const jugador = unJugadorNuevo();
  const registro = await pagina.request.post("/api/jugadores", { data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: VERSION_LEGAL_DEL_REGISTRO } });
  expect(registro.status()).toBe(201);
  const [precio, adelanto] = desde >= "18:00" ? ["80.00", "40.00"] : ["60.00", "30.00"];
  const reserva = await pagina.request.post("/api/reservas", { data: { canchaId: cancha, fecha, desde, precio, adelanto, adicionales: [] } });
  expect(reserva.status(), await reserva.text()).toBe(201);
  const { codigo } = (await reserva.json()) as { codigo: string };
  await contexto.close();
  return { codigo, celular: jugador.celular };
}

async function entrarComoRecepcion(pagina: Page) {
  await entrarComoAdministrador(pagina);
  const recepcionista = await crearPorApi(pagina);
  await cerrarSesion(pagina);
  await iniciarSesion(pagina, correoDe(recepcionista), "temporal2026");
  await confirmarMisDatos(pagina);
  await pagina.getByRole("button", { name: "Ahora no" }).click();
  await expect(pagina).toHaveURL("/recepcion", { timeout: 20_000 });
}

const turnos = (pagina: Page) => pagina.getByRole("list", { name: "Turnos del día" }).getByRole("listitem");
const turno = (pagina: Page, codigo: string) => turnos(pagina).filter({ hasText: codigo });

test.beforeAll(async ({ browser }, informacion) => {
  canchas = await prepararElLocal(browser);
  // Cada proyecto mira su propio día, para no chocar con los turnos que separó el otro.
  fecha = fechaDeLima(informacion.project.name.includes("celular") ? 4 : 3);
  const contexto = await browser.newContext();
  const admin = await contexto.newPage();
  await entrarComoAdministrador(admin);
  const regla = await admin.request.put("/api/cancelacion/regla", { data: { rangos: [{ desdeHoras: "24", porcentaje: "100", ofreceCredito: false }, { desdeHoras: "0", porcentaje: "0", ofreceCredito: false }] } });
  expect(regla.ok()).toBe(true);
  await contexto.close();
});

test("abre en los turnos de hoy y permite elegir otra fecha", async ({ page }) => {
  await entrarComoRecepcion(page);

  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: new RegExp(diaLargo(fechaDeLima()), "i") })).toBeVisible();
  await expect(page.getByText("Hoy", { exact: true })).toBeVisible();

  await page.getByLabel("Elegir fecha").fill(fecha);

  await expect(page).toHaveURL(`/recepcion?fecha=${fecha}`);
  await expect(page.getByRole("heading", { name: new RegExp(diaLargo(fecha), "i") })).toBeVisible();
  await page.getByRole("button", { name: "Ir a hoy" }).click();
  await expect(page).toHaveURL("/recepcion");
});

test("muestra cada turno en orden de hora con cancha, cliente, celular, estado, pagado y saldo", async ({ page, browser }) => {
  const tarde = await separarTurno(browser, canchas["Disp Uno"], "16:30");
  const temprano = await separarTurno(browser, canchas["Disp Uno"], "13:30");
  await entrarComoRecepcion(page);

  await page.goto(`/recepcion?fecha=${fecha}`);
  await expect(turno(page, tarde.codigo)).toBeVisible();

  const codigos = await turnos(page).allTextContents();
  const posicion = (codigo: string) => codigos.findIndex((texto) => texto.includes(codigo));
  expect(posicion(temprano.codigo)).toBeGreaterThanOrEqual(0);
  expect(posicion(temprano.codigo)).toBeLessThan(posicion(tarde.codigo));
  const fila = turno(page, temprano.codigo);
  await expect(fila).toContainText("13:30–14:30");
  await expect(fila).toContainText("Disp Uno");
  await expect(fila).toContainText("Valeria León Paredes");
  await expect(fila.getByRole("link", { name: temprano.celular.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3") })).toBeVisible();
  await expect(fila).toContainText("Por pagar");
  await expect(fila).toContainText(/Pagado\s*S\/ 0\.00/);
  await expect(fila).toContainText(/Saldo\s*S\/ 60\.00/);
});

test("filtra por cancha y por estado", async ({ page, browser }) => {
  const enUno = await separarTurno(browser, canchas["Disp Uno"], "11:30");
  const enDos = await separarTurno(browser, canchas["Disp Dos"], "11:30");
  await cambiarEstadoDeReserva(enDos.codigo, "confirmada");
  await entrarComoRecepcion(page);
  await page.goto(`/recepcion?fecha=${fecha}`);
  await expect(turno(page, enUno.codigo)).toBeVisible();

  await page.getByLabel("Cancha").selectOption({ label: "Disp Dos" });

  await expect(turno(page, enDos.codigo)).toBeVisible();
  await expect(turno(page, enUno.codigo)).toHaveCount(0);
  await page.getByLabel("Cancha").selectOption({ label: "Todas las canchas" });
  await page.getByRole("link", { name: /^Por pagar \d+$/ }).click();
  await expect(turno(page, enUno.codigo)).toBeVisible();
  await expect(turno(page, enDos.codigo)).toHaveCount(0);
});

test("una confirmada con saldo dice cuánto falta cobrar", async ({ page, browser }) => {
  const reserva = await separarTurno(browser, canchas["Disp Uno"], "09:30");
  await cambiarEstadoDeReserva(reserva.codigo, "confirmada");
  await entrarComoRecepcion(page);

  await page.goto(`/recepcion?fecha=${fecha}`);

  await expect(turno(page, reserva.codigo)).toContainText("Confirmada");
  await expect(turno(page, reserva.codigo)).toContainText("Falta cobrar S/ 60.00");
});

test("solo muestra acciones de procesos que existen y ninguna en una reserva expirada", async ({ page, browser }) => {
  const confirmada = await separarTurno(browser, canchas["Disp Uno"], "07:30");
  const vencida = await separarTurno(browser, canchas["Disp Dos"], "07:30");
  await cambiarEstadoDeReserva(confirmada.codigo, "confirmada");
  await vencerReserva(vencida.codigo);
  await entrarComoRecepcion(page);

  await page.goto(`/recepcion?fecha=${fecha}`);

  await expect(turno(page, vencida.codigo)).toContainText("Expirada");
  for (const codigo of [confirmada.codigo, vencida.codigo]) {
    await expect(turno(page, codigo).getByRole("link", { name: /check-in|ausente|cancelar|reubicar|finalizar/i })).toHaveCount(0);
  }
});

test("refleja una reserva nueva y un cambio de estado sin recargar, en menos de 10 segundos", async ({ page, browser }) => {
  await entrarComoRecepcion(page);
  await page.goto(`/recepcion?fecha=${fecha}`);
  await expect(page.getByText("En vivo")).toBeVisible();

  const nueva = await separarTurno(browser, canchas["Disp Uno"], "20:30");

  await expect(turno(page, nueva.codigo)).toContainText("Por pagar", { timeout: 10_000 });
  await cambiarEstadoDeReserva(nueva.codigo, "en_juego");
  await expect(turno(page, nueva.codigo)).toContainText("En juego", { timeout: 10_000 });
});

test("administración ve la misma agenda en su panel", async ({ page, browser }) => {
  const reserva = await separarTurno(browser, canchas["Disp Uno"], "22:30");
  await entrarComoAdministrador(page);

  await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("/administracion/agenda");
  await page.getByLabel("Elegir fecha").fill(fecha);

  await expect(turno(page, reserva.codigo)).toContainText("Por pagar");
});
