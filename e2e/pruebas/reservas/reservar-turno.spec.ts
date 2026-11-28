import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";
import { datosDeReserva, guardarReserva, vencerReserva } from "../../soporte/base-de-pruebas";
import { llenarRegistro, registrarPorApi, unJugadorNuevo } from "../../soporte/jugador-de-prueba";
import { type CanchasDelLocal, fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { abrirElDia, celda, tuTurno } from "../../soporte/mapa-de-prueba";
import { entrarComoRecepcion } from "../../soporte/recepcionistas-de-prueba";
import { inicioDelTurno, momentoDelLocal, pedirSeparar, rutaDeConfirmacion, separarPorApi, type TurnoDePrueba } from "../../soporte/reserva-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// Cambia la tarifa y la regla de cancelación del local: corre en orden, después de la disponibilidad.
test.describe.configure({ mode: "serial" });

const REGLA = { rangos: [{ desdeHoras: "24", porcentaje: "100", ofreceCredito: true }, { desdeHoras: "0", porcentaje: "0", ofreceCredito: false }] };
const TARIFA = { precioDia: "60", precioNoche: "80", duracionDelTurno: "1", ofreceTurnoCorto: false };

let canchas: CanchasDelLocal;
let fecha: string;
let administracion: BrowserContext;
let balonId: number;

const turno = (cancha: keyof CanchasDelLocal, desde: string, dia = fecha): TurnoDePrueba => ({ canchaId: canchas[cancha], fecha: dia, desde });
const admin = () => administracion.request;
const guardarComoAdmin = async (ruta: string, datos: object) => expect((await admin().put(ruta, { data: datos })).ok()).toBe(true);

/** Un contexto nuevo con un jugador registrado y su sesión abierta. */
async function unJugador(navegador: Browser) {
  const contexto = await navegador.newContext();
  const jugador = await registrarPorApi(contexto.request);
  return { contexto, jugador, pagina: await contexto.newPage() };
}

// Next también tiene un `role="alert"` vacío, que anuncia los cambios de ruta.
const turnoNoDisponible = (pagina: Page) => pagina.getByRole("alert").filter({ hasText: "Este turno no se puede separar" });

const separar = (pagina: Page, cancha: string, desde: string, hasta: string) =>
  pagina.getByRole("button", { name: `Separar ${cancha} · ${desde}–${hasta}` }).click();

test.beforeAll(async ({ browser }, informacion) => {
  canchas = await prepararElLocal(browser);
  // Cada proyecto separa en su propio día, para no chocar con los turnos del otro.
  fecha = fechaDeLima(informacion.project.name.includes("celular") ? 6 : 5);
  administracion = await browser.newContext();
  await entrarComoAdministrador(await administracion.newPage());
  await guardarComoAdmin("/api/cancelacion/regla", REGLA);
  const balon = await admin().post("/api/adicionales", { data: { nombre: "Balón de reserva", descripcion: "Número 5", precio: "35" } });
  // En el segundo proyecto el balón ya existe.
  const catalogo = (await (await admin().get("/api/adicionales")).json()) as { id: number; nombre: string }[];
  expect([201, 409]).toContain(balon.status());
  balonId = catalogo.find((a) => a.nombre === "Balón de reserva")!.id;
});

test.afterAll(() => administracion.close());

test("un turno libre muestra «Reservar» con su cancha y su hora, en el panel y en la portada con sesión", async ({ page }) => {
  await registrarPorApi(page.request);

  for (const ruta of ["/inicio/reservar", "/"]) {
    await abrirElDia(page, fecha, ruta);
    await celda(page, "Disp Uno", "08:30").click();
    await expect(tuTurno(page).getByRole("link", { name: "Reservar Disp Uno · 08:30–09:30" })).toBeVisible();
  }
  await tuTurno(page).getByRole("link", { name: "Reservar Disp Uno · 08:30–09:30" }).click();
  await expect(page).toHaveURL(rutaDeConfirmacion(turno("Disp Uno", "08:30")));
});

test("sin sesión, ingresar o crear la cuenta vuelve al mismo turno, y recargar no lo pierde", async ({ page, browser }) => {
  const registrado = await unJugador(browser);
  await registrado.contexto.close();
  const confirmacion = rutaDeConfirmacion(turno("Disp Uno", "09:30"));

  await abrirElDia(page, fecha);
  await celda(page, "Disp Uno", "09:30").click();
  await tuTurno(page).getByRole("link", { name: "Ingresar para reservar" }).click();
  await page.getByLabel("Correo").fill(registrado.jugador.correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(registrado.jugador.contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL(confirmacion, { timeout: 20_000 });
  await page.reload();
  await expect(page.getByRole("region", { name: "Tu turno" })).toContainText("Disp Uno");
  await expect(page.getByRole("button", { name: "Separar Disp Uno · 09:30–10:30" })).toBeVisible();

  const nuevo = await (await browser.newContext()).newPage();
  await abrirElDia(nuevo, fecha);
  await celda(nuevo, "Disp Uno", "09:30").click();
  await tuTurno(nuevo).getByRole("link", { name: "Crear cuenta" }).click();
  await llenarRegistro(nuevo, unJugadorNuevo());
  await nuevo.getByRole("checkbox", { name: /acepto los términos/i }).check();
  await nuevo.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(nuevo).toHaveURL(confirmacion, { timeout: 20_000 });
  await expect(nuevo.getByRole("button", { name: "Separar Disp Uno · 09:30–10:30" })).toBeVisible();
});

test("si el turno se ocupa mientras se revisa el resumen, lo avisa y lleva a elegir otro", async ({ page }) => {
  await registrarPorApi(page.request);
  await page.goto(rutaDeConfirmacion(turno("Disp Uno", "10:30")));
  await expect(page.getByRole("button", { name: "Separar Disp Uno · 10:30–11:30" })).toBeVisible();

  await guardarReserva(canchas["Disp Uno"], fecha, "10:30", "confirmada");

  await expect(turnoNoDisponible(page)).toContainText("Este turno ya no está libre. Elige otro.", { timeout: 10_000 });
  await page.getByRole("link", { name: "Elegir otro turno" }).click();
  await expect(page).toHaveURL("/inicio/reservar");
});

test("el resumen muestra la cancha, la fecha, la hora, el precio, el adelanto y la regla con sus horas límite", async ({ page }) => {
  await registrarPorApi(page.request);
  const elegido = turno("Disp Dos", "11:30");

  await page.goto(rutaDeConfirmacion(elegido));

  const resumen = page.getByRole("region", { name: "Tu turno" });
  await expect(resumen).toContainText("Disp Dos");
  await expect(resumen).toContainText("11:30–12:30");
  await expect(resumen.getByRole("list", { name: "Cómo es la cancha" }).getByRole("listitem")).toHaveText(["Fútbol 5", "Solo con luz natural"]);
  await expect(page.getByText("Precio final, con IGV")).toBeVisible();
  await expect(page.getByText("S/ 60.00", { exact: true })).toBeVisible();
  await expect(page.getByText(/Adelanto para confirmarla \(50 %\)/)).toBeVisible();
  const limite = new Date(inicioDelTurno(elegido).getTime() - 24 * 60 * 60 * 1000);
  await expect(page.getByRole("region", { name: "Si cancelas" })).toContainText(`Hasta el ${momentoDelLocal(limite)}`);
  await expect(page.getByRole("region", { name: "Si cancelas" })).toContainText("Se devuelve el 100 % del adelanto");
});

test("muestra el material del local con su precio por unidad, sin marcar, y marcarlo solo avisa", async ({ page }) => {
  await registrarPorApi(page.request);
  await page.goto(rutaDeConfirmacion(turno("Disp Uno", "12:30")));

  const balon = page.getByRole("checkbox", { name: /Balón de reserva/ });
  await expect(balon).not.toBeChecked();
  await expect(page.getByText("S/ 35.00 por unidad perdida o rota")).toBeVisible();
  await balon.check();
  await separar(page, "Disp Uno", "12:30", "13:30");

  const loQuePagas = page.getByRole("region", { name: "Lo que pagas" });
  await expect(loQuePagas).toContainText("Te tendrán listo: Balón de reserva. Solo se paga si se pierde o se rompe.", { timeout: 15_000 });
  await expect(loQuePagas).toContainText("S/ 60.00");
});

test("si la tarifa cambia antes de confirmar, no separa y muestra el precio nuevo para confirmar otra vez", async ({ page }) => {
  await registrarPorApi(page.request);
  await page.goto(rutaDeConfirmacion(turno("Disp Uno", "13:30")));
  await expect(page.getByText("S/ 60.00", { exact: true })).toBeVisible();

  await guardarComoAdmin("/api/tarifas/FUTBOL_5", { ...TARIFA, precioDia: "70" });
  try {
    await separar(page, "Disp Uno", "13:30", "14:30");

    await expect(page.getByText("El precio de este turno cambió. Revisa los montos nuevos y confirma otra vez.")).toBeVisible();
    await expect(page.getByText("S/ 70.00", { exact: true })).toBeVisible();
    await separar(page, "Disp Uno", "13:30", "14:30");
    await expect(page.getByRole("heading", { name: "Turno separado" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("region", { name: "Lo que pagas" })).toContainText("S/ 70.00");
  } finally {
    await guardarComoAdmin("/api/tarifas/FUTBOL_5", TARIFA);
  }
});

test("el server vuelve a comprobar cada regla aunque se escriba el turno a mano", async ({ page, browser }) => {
  await registrarPorApi(page.request);
  const rechazados: [TurnoDePrueba, string][] = [
    [turno("Disp Dos", "19:30"), "Este turno ya no está libre. Elige otro."],
    [turno("Disp Apagada", "11:30"), "Este turno ya no está libre. Elige otro."],
    [turno("Disp Uno", "07:00"), "Este turno ya no está libre. Elige otro."],
    [turno("Disp Uno", "11:30", fechaDeLima(31)), "Solo se pueden consultar los próximos 30 días."],
  ];

  for (const [elegido, motivo] of rechazados) {
    await page.goto(rutaDeConfirmacion(elegido));
    await expect(turnoNoDisponible(page)).toContainText(motivo);
    expect((await pedirSeparar(page.request, elegido)).status()).toBeGreaterThanOrEqual(400);
  }
  const personal = await (await browser.newContext()).newPage();
  await entrarComoAdministrador(personal);
  expect((await pedirSeparar(personal.request, turno("Disp Uno", "11:30"))).status()).toBe(403);
});

test("50 pedidos a la vez por el mismo turno crean una sola reserva", async ({ browser }) => {
  test.setTimeout(180_000);
  const jugadores: BrowserContext[] = [];
  for (let lote = 0; lote < 5; lote++) {
    const nuevos = await Promise.all(Array.from({ length: 10 }, () => unJugador(browser)));
    jugadores.push(...nuevos.map(({ contexto }) => contexto));
  }

  const respuestas = await Promise.all(jugadores.map((contexto) => pedirSeparar(contexto.request, turno("Disp Dos", "14:30"))));

  const estados = respuestas.map((respuesta) => respuesta.status());
  const cuenta = JSON.stringify(Object.groupBy(estados, (estado) => estado));
  expect(estados.filter((estado) => estado === 201), cuenta).toHaveLength(1);
  expect(estados.filter((estado) => estado === 409)).toHaveLength(49);
  await Promise.all(jugadores.map((contexto) => contexto.close()));
});

test("un jugador no puede tener más de 2 reservas esperando pago", async ({ page }) => {
  await registrarPorApi(page.request);
  await separarPorApi(page.request, turno("Disp Uno", "15:30"));
  await separarPorApi(page.request, turno("Disp Uno", "16:30"));

  await page.goto(rutaDeConfirmacion(turno("Disp Uno", "17:30")));
  await separar(page, "Disp Uno", "17:30", "18:30");

  await expect(page.getByText("Ya hay 2 reservas esperando pago. Para separar otra, paga una o espera a que venza.")).toBeVisible();
});

test("al separar, retiene el turno 15 minutos y muestra el código, el estado, cuánto falta y qué pasa al vencer", async ({ page, browser }) => {
  await registrarPorApi(page.request);
  await page.goto(rutaDeConfirmacion(turno("Disp Uno", "18:30")));

  await separar(page, "Disp Uno", "18:30", "19:30");

  await expect(page).toHaveURL(/\/inicio\/mis-reservas\/[A-Z0-9]{6}$/, { timeout: 15_000 });
  const codigo = page.url().slice(-6);
  await expect(page.getByRole("heading", { name: "Turno separado" })).toBeVisible();
  await expect(page.getByText(codigo, { exact: true })).toBeVisible();
  await expect(page.getByRole("timer", { name: "Tiempo que queda" })).toHaveText(/^1[45]:\d{2}$/);
  await expect(page.getByText(/el turno se libera solo y no se cobra nada/)).toBeVisible();
  expect((await datosDeReserva(codigo)).minutosDeRetencion).toBe(15);
  const publico = await (await browser.newContext()).newPage();
  await abrirElDia(publico, fecha);
  await expect(celda(publico, "Disp Uno", "18:30")).toHaveText("Pendiente");
});

test("al vencer, el turno se ve libre sin esperar ninguna tarea y quien lo reserva expira la anterior", async ({ page, browser }) => {
  await registrarPorApi(page.request);
  const codigo = await separarPorApi(page.request, turno("Disp Uno", "19:30"));

  await vencerReserva(codigo);

  const publico = await (await browser.newContext()).newPage();
  await abrirElDia(publico, fecha);
  await expect(celda(publico, "Disp Uno", "19:30")).toHaveText("Libre");
  await page.goto(`/inicio/mis-reservas/${codigo}`);
  await expect(page.getByRole("heading", { name: "La reserva venció" })).toBeVisible();
  const otro = await unJugador(browser);
  await separarPorApi(otro.contexto.request, turno("Disp Uno", "19:30"));
  expect((await datosDeReserva(codigo)).estado).toBe("expirada");
});

test("la reserva guarda canal, autor, montos, regla, vencimiento y material, y un cambio posterior no la altera", async ({ page }) => {
  await registrarPorApi(page.request);
  const codigo = await separarPorApi(page.request, turno("Disp Uno", "20:30"), [balonId]);
  const guardada = await datosDeReserva(codigo);

  expect(guardada).toMatchObject({ canal: "web", creadaPorElTitular: true, precio: "80.00", porcentaje: 50, adelanto: "40.00", minutosDeRetencion: 15, adicionales: ["Balón de reserva"] });
  expect(guardada.reglaId).toBe(guardada.reglaVigenteId);
  await guardarComoAdmin("/api/tarifas/FUTBOL_5", { ...TARIFA, precioNoche: "95" });
  await guardarComoAdmin("/api/cancelacion/regla", { rangos: [{ desdeHoras: "48", porcentaje: "50", ofreceCredito: false }, { desdeHoras: "0", porcentaje: "0", ofreceCredito: false }] });
  try {
    await page.goto(`/inicio/mis-reservas/${codigo}`);
    await expect(page.getByRole("region", { name: "Lo que pagas" })).toContainText("S/ 80.00");
    await expect(page.getByRole("region", { name: "Si cancelas" })).toContainText("Se devuelve el 100 % del adelanto");
  } finally {
    await guardarComoAdmin("/api/tarifas/FUTBOL_5", TARIFA);
    await guardarComoAdmin("/api/cancelacion/regla", REGLA);
  }
});

test("cada reserva entra al historial de cambios como importante", async ({ page }) => {
  await registrarPorApi(page.request);
  const codigo = await separarPorApi(page.request, turno("Disp Uno", "21:30"));
  const historial = await administracion.newPage();

  await historial.goto("/administracion/historial?categoria=RESERVAS");

  const registro = historial.getByRole("listitem").filter({ hasText: codigo });
  await expect(registro).toContainText("Importante");
  await expect(registro).toContainText("separó la");
  await historial.close();
});

test("el mapa se actualiza al momento y a recepción le llega «Nueva reserva» en la campana", async ({ page, browser }) => {
  await abrirElDia(page, fecha);
  await expect(celda(page, "Disp Dos", "16:30")).toHaveText("Libre");
  const recepcion = await (await browser.newContext()).newPage();
  await entrarComoRecepcion(recepcion);
  const jugador = await unJugador(browser);

  const codigo = await separarPorApi(jugador.contexto.request, turno("Disp Dos", "16:30"));

  await expect(celda(page, "Disp Dos", "16:30")).toHaveText("Pendiente", { timeout: 10_000 });
  await recepcion.getByRole("button", { name: /^Avisos, \d+ sin leer/ }).click({ timeout: 10_000 });
  await expect(recepcion.getByRole("link", { name: new RegExp(`^Nueva reserva ${codigo}`) })).toBeVisible();
});
