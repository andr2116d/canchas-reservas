import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { abrirElDia, celda } from "../../soporte/mapa-de-prueba";
import { altaPorRecepcion, campo, cobrosDeReserva, type CobroDePrueba, datosDelCheckIn, type EstadoParaCheckIn, limpiarReservaDeRecepcion, moverParaCheckIn, reservarPorRecepcion } from "../../soporte/recepcion-de-prueba";
import { entrarComoRecepcion } from "../../soporte/recepcionistas-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

let recepcion: BrowserContext;
let administracion: BrowserContext;
let pagina: Page;
let canchaId: number;
let recepcionistaId: number;
let creadas: string[];
const cancha = "Checkin Pruebas";
const adelanto = { monto: "30.00", metodo: "EFECTIVO" } as const;
const ventanaAmplia = { minutosAntes: 120, minutosDespues: 120 };
const ajustes = () => administracion.request;
const ruta = (codigo: string) => `/recepcion/reservas/${codigo}/check-in`;
const enviar = (codigo: string, data: object = {}, contexto = recepcion) => contexto.request.post(`/api${ruta(codigo)}`, { data });
const fila = (vista: Page, codigo: string) => vista.getByRole("list", { name: "Turnos del día" }).getByRole("listitem").filter({ hasText: codigo });

async function aplicarVentana(data: { minutosAntes: number; minutosDespues: number }) {
  const respuesta = await ajustes().put("/api/ventana-de-llegada", { data });
  expect(respuesta.status(), await respuesta.text()).toBe(200);
}

function turnoDeHoy() {
  const fecha = fechaDeLima();
  const texto = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const [hora, minuto] = texto.split(":").map(Number);
  const horaDeInicio = Math.min(22, Math.max(0, Math.round((hora * 60 + minuto - 30) / 60)));
  const desde = `${String(horaDeInicio).padStart(2, "0")}:30`;
  return { fecha, desde, inicio: new Date(`${fecha}T${desde}:00-05:00`) };
}

async function prepararReserva({ cobro = adelanto, mover = true, estado = "confirmada" }: { cobro?: CobroDePrueba; mover?: boolean; estado?: EstadoParaCheckIn } = {}) {
  const { cliente } = await altaPorRecepcion(recepcion.request);
  const turno = { canchaId, fecha: fechaDeLima(8), desde: "08:30" };
  const { codigo } = await reservarPorRecepcion(recepcion.request, turno, cliente.id, cobro);
  creadas.push(codigo);
  const hoy = turnoDeHoy();
  if (mover) await moverParaCheckIn(codigo, hoy.inicio, estado);
  return { codigo, ...hoy };
}

test.beforeAll(async ({ browser }) => {
  await prepararElLocal(browser);
  administracion = await browser.newContext();
  await entrarComoAdministrador(await administracion.newPage());
  const canchas = await (await ajustes().get("/api/canchas")).json() as { nombre: string; id: number }[];
  const existente = canchas.find(({ nombre }) => nombre === cancha);
  if (existente) canchaId = existente.id;
  else {
    const creada = await ajustes().post("/api/canchas", { data: { canchas: [{ nombre: cancha, tipo: "FUTBOL_5", tieneIluminacion: true, caracteristicas: [], nota: "" }] } });
    expect(creada.status(), await creada.text()).toBe(201);
    canchaId = ((await creada.json()) as { id: number }[])[0].id;
  }
  const regla = await ajustes().put("/api/cancelacion/regla", { data: { rangos: [{ desdeHoras: "0", porcentaje: "100", ofreceCredito: false }] } });
  expect(regla.status(), await regla.text()).toBe(200);
  await aplicarVentana(ventanaAmplia);
  recepcion = await browser.newContext();
  recepcionistaId = (await entrarComoRecepcion(await recepcion.newPage())).id;
});

test.beforeEach(async () => { creadas = []; pagina = await recepcion.newPage(); });
test.afterEach(async () => { await pagina?.close(); for (const codigo of creadas) await limpiarReservaDeRecepcion(codigo); });
test.afterAll(async () => { await recepcion?.close(); await administracion?.close(); });

test("1. solo ofrece el check-in de una reserva confirmada de hoy desde recepción", async () => {
  const hoy = await prepararReserva();
  const futura = await prepararReserva({ mover: false });
  await pagina.goto("/recepcion");
  const accion = fila(pagina, hoy.codigo).getByRole("link", { name: "Hacer check-in" });
  await expect(accion).toBeVisible();
  await accion.click();
  await expect(pagina).toHaveURL(ruta(hoy.codigo));
  await pagina.goto(`/recepcion?fecha=${fechaDeLima(8)}`);
  await expect(fila(pagina, futura.codigo)).toBeVisible();
  await expect(fila(pagina, futura.codigo).getByRole("link", { name: "Hacer check-in" })).toHaveCount(0);
  const rechazo = await enviar(futura.codigo);
  expect(rechazo.status()).toBe(409);
  expect((await rechazo.json()).message).toContain("reservas de hoy");
});

test("2. administración versiona la ventana y recepción oculta la acción fuera de ella", async () => {
  const admin = await administracion.newPage();
  try {
    await admin.goto("/administracion/reglas-de-reserva");
    const tarjeta = admin.getByRole("region", { name: "Ventana de llegada" });
    await expect(tarjeta.getByLabel("Minutos antes del inicio")).toHaveValue("120");
    await tarjeta.getByLabel("Minutos antes del inicio").fill("121");
    await tarjeta.getByRole("button", { name: "Guardar ventana de llegada" }).click();
    await expect(tarjeta.getByText("Ingresa un número entero de 0 a 120.")).toBeVisible();
    await tarjeta.getByLabel("Minutos antes del inicio").fill("0");
    await tarjeta.getByLabel("Minutos después del inicio").fill("0");
    await tarjeta.getByRole("button", { name: "Guardar ventana de llegada" }).click();
    await expect(tarjeta.getByText("Ventana guardada para las reservas nuevas.")).toBeVisible();
    await tarjeta.getByText(/Ventanas de llegada anteriores/).click();
    await expect(tarjeta.getByText("120 min antes · 120 min después", { exact: true }).first()).toBeVisible();
    const { codigo } = await prepararReserva();
    await pagina.goto("/recepcion");
    await expect(fila(pagina, codigo)).toBeVisible();
    await expect(fila(pagina, codigo).getByRole("link", { name: "Hacer check-in" })).toHaveCount(0);
    const respuesta = await enviar(codigo);
    expect(respuesta.status()).toBe(409);
    expect((await respuesta.json()).message).toMatch(/desde las|ventana de check-in/);
  } finally {
    await aplicarVentana(ventanaAmplia);
    await admin.close();
  }
});

test("3. todos los estados distintos de confirmada ocultan el botón y el servidor indica el motivo", async () => {
  const { codigo, inicio } = await prepararReserva();
  for (const estado of ["pendiente_de_pago", "pendiente_de_validacion", "cancelada", "expirada", "ausente", "en_juego", "finalizada"] as const) {
    await moverParaCheckIn(codigo, inicio, estado);
    const respuesta = await enviar(codigo);
    expect(respuesta.status()).toBe(409);
    expect((await respuesta.json()).message).toContain("Solo se puede hacer check-in de una reserva confirmada.");
  }
  await pagina.goto("/recepcion");
  await expect(fila(pagina, codigo)).toContainText("Finalizada");
  await expect(fila(pagina, codigo).getByRole("link", { name: "Hacer check-in" })).toHaveCount(0);
});

test("4. muestra el precio guardado, lo pagado y el saldo con céntimos", async () => {
  const { codigo } = await prepararReserva({ cobro: { ...adelanto, monto: "43.75" } });
  await pagina.goto(ruta(codigo));
  const detalle = pagina.getByRole("region", { name: `Reserva ${codigo}` });
  for (const [concepto, monto] of [["Precio total con IGV", "60.00"], ["Ya pagado", "43.75"], ["Saldo pendiente", "16.25"]]) {
    await expect(detalle.getByText(concepto, { exact: true })).toBeVisible();
    await expect(detalle.getByText(`S/ ${monto}`, { exact: true })).toBeVisible();
  }
});

test("5. Yape y Plin piden operación, y efectivo deja el número vacío", async () => {
  const { codigo } = await prepararReserva();
  await pagina.goto(ruta(codigo));
  const metodo = campo(pagina, "Método de pago");
  await metodo.selectOption("YAPE");
  await expect(campo(pagina, "Número de operación")).toBeVisible();
  await pagina.getByRole("button", { name: "Cobrar y hacer check-in" }).click();
  await expect(pagina.getByText("Ingresa el número de operación.")).toBeVisible();
  await metodo.selectOption("EFECTIVO");
  await expect(campo(pagina, "Número de operación")).toHaveCount(0);
  await metodo.selectOption("PLIN");
  await campo(pagina, "Número de operación").fill("SALDO-PLIN-" + randomUUID());
  await pagina.getByRole("button", { name: "Cobrar y hacer check-in" }).click();
  await expect(pagina.getByRole("heading", { name: "Check-in registrado" })).toBeVisible();
});

test("6. rechaza importes menores y mayores y registra el saldo exacto en efectivo", async () => {
  const { codigo } = await prepararReserva();
  await pagina.goto(ruta(codigo));
  await campo(pagina, "Método de pago").selectOption("EFECTIVO");
  const monto = campo(pagina, "Monto");
  const confirmar = pagina.getByRole("button", { name: "Cobrar y hacer check-in" });
  await monto.fill("29.99");
  await confirmar.click();
  await expect(pagina.getByText("Falta cobrar S/ 0.01.")).toBeVisible();
  await monto.fill("50.00");
  await confirmar.click();
  await expect(pagina.getByText(/Corrige el monto/)).toBeVisible();
  await monto.fill("30.00");
  await confirmar.click();
  await expect(pagina.getByRole("heading", { name: "Check-in registrado" })).toBeVisible();
  expect(await cobrosDeReserva(codigo)).toMatchObject([expect.any(Object), { concepto: "saldo", monto: "30.00", metodo: "efectivo", operacion: null }]);
});

test("7. hace check-in sin cobro cuando el turno ya está pagado", async () => {
  const { codigo } = await prepararReserva({ cobro: { ...adelanto, monto: "60.00" } });
  await pagina.goto(ruta(codigo));
  await expect(pagina.getByText(/sin cobro/)).toBeVisible();
  await expect(campo(pagina, "Monto")).toHaveCount(0);
  await pagina.getByRole("button", { name: "Hacer check-in" }).click();
  await expect(pagina.getByRole("heading", { name: "Check-in registrado" })).toBeVisible();
  expect(await cobrosDeReserva(codigo)).toMatchObject([{ concepto: "adelanto", monto: "60.00" }]);
});

test("8. cambia a En juego y guarda el momento y la persona", async () => {
  const { codigo } = await prepararReserva();
  await pagina.goto("/recepcion");
  await expect(fila(pagina, codigo)).toContainText("Confirmada");
  const respuesta = await enviar(codigo, { monto: "30.00", metodo: "EFECTIVO" });
  expect(respuesta.status()).toBe(200);
  const guardada = await datosDelCheckIn(codigo);
  expect(guardada).toMatchObject({ estado: "en_juego", checkInPorId: recepcionistaId, checkInEn: new Date((await respuesta.json()).checkInEn) });
  await expect(fila(pagina, codigo)).toContainText("En juego", { timeout: 10_000 });
});

test("9. el saldo queda disponible para la caja del cobrador, separado por método", async () => {
  const { codigo } = await prepararReserva();
  const numeroOperacion = randomUUID();
  const respuesta = await enviar(codigo, { monto: "30.00", metodo: "YAPE", numeroOperacion });
  expect(respuesta.status()).toBe(200);
  expect(await cobrosDeReserva(codigo)).toMatchObject([
    { concepto: "adelanto", metodo: "efectivo" },
    { concepto: "saldo", metodo: "yape", autor: recepcionistaId, operacion: numeroOperacion.toUpperCase(), monto: "30.00", fecha: expect.any(Date) },
  ]);
});

test("10. una operación electrónica repetida revierte el estado, la hora y el cobro", async () => {
  const numeroOperacion = randomUUID();
  const { codigo } = await prepararReserva({ cobro: { ...adelanto, metodo: "YAPE", numeroOperacion } });
  const respuesta = await enviar(codigo, { monto: "30.00", metodo: "PLIN", numeroOperacion });
  expect(respuesta.status()).toBe(409);
  expect((await respuesta.json()).errores.numeroOperacion).toContain(codigo);
  expect(await datosDelCheckIn(codigo)).toMatchObject({ estado: "confirmada", checkInEn: null, checkInPorId: null });
  expect(await cobrosDeReserva(codigo)).toHaveLength(1);
});

test("11. dos recepcionistas registran un solo cobro y la segunda ve que ya se hizo", async ({ browser }) => {
  const segunda = await browser.newContext();
  try {
    const vista = await segunda.newPage();
    await entrarComoRecepcion(vista);
    const { codigo } = await prepararReserva();
    const data = { monto: "30.00", metodo: "EFECTIVO" };
    const respuestas = await Promise.all([enviar(codigo, data), enviar(codigo, data, segunda)]);
    expect(respuestas.map((respuesta) => respuesta.status())).toEqual([200, 200]);
    const resultados = await Promise.all(respuestas.map((respuesta) => respuesta.json()));
    expect(resultados.map(({ tipo }) => tipo)).toEqual(expect.arrayContaining(["realizado", "ya-realizado"]));
    expect(resultados[0].checkInEn).toBe(resultados[1].checkInEn);
    expect((await cobrosDeReserva(codigo)).filter(({ concepto }) => concepto === "saldo")).toHaveLength(1);
    await vista.goto(ruta(codigo));
    await expect(vista.getByRole("heading", { name: "El check-in ya se hizo" })).toBeVisible();
  } finally {
    await segunda.close();
  }
});

test("12. el historial registra el check-in como importante, con su autor", async () => {
  const { codigo } = await prepararReserva();
  expect((await enviar(codigo, { monto: "30.00", metodo: "EFECTIVO" })).status()).toBe(200);
  const respuesta = await ajustes().get("/api/historial?categoria=RESERVAS&accion=CHECK_IN&soloImportantes=true");
  expect(respuesta.status(), await respuesta.text()).toBe(200);
  expect((await respuesta.json()).registros).toEqual(expect.arrayContaining([expect.objectContaining({ importante: true, accion: "CHECK_IN", sujeto: `Reserva ${codigo}`, autor: expect.objectContaining({ id: recepcionistaId }) })]));
});

test("13. el mapa vuelve a consultar al registrar el check-in y muestra Ocupado", async () => {
  const { codigo, fecha, desde } = await prepararReserva();
  await abrirElDia(pagina, fecha, "/recepcion/disponibilidad");
  const mostrarEmpezados = pagina.getByRole("button", { name: /Mostrar .*turno.*ya empez/ });
  if (await mostrarEmpezados.isVisible()) await mostrarEmpezados.click();
  await expect(celda(pagina, cancha, desde)).toHaveText("Ocupado");
  const actualizado = pagina.waitForResponse((respuesta) => respuesta.url().includes("/api/disponibilidad") && respuesta.request().method() === "GET" && respuesta.ok(), { timeout: 10_000 });
  expect((await enviar(codigo, { monto: "30.00", metodo: "EFECTIVO" })).status()).toBe(200);
  await actualizado;
  await expect(celda(pagina, cancha, desde)).toHaveText("Ocupado");
});

test("seguridad. exige sesión y permisos distintos para el check-in y la configuración", async ({ browser }) => {
  const contexto = await browser.newContext();
  try {
    const { codigo } = await prepararReserva();
    expect((await enviar(codigo, {}, contexto)).status()).toBe(401);
    await registrarPorApi(contexto.request);
    expect((await enviar(codigo, {}, contexto)).status()).toBe(403);
    expect((await enviar(codigo, {}, administracion)).status()).toBe(403);
    const invalido = await enviar(codigo, { actorId: 10 }, recepcion);
    expect(invalido.status()).toBe(400);
    expect(await invalido.json()).toMatchObject({ statusCode: 400, message: expect.any(String), errores: { actorId: expect.any(String) } });
    expect((await recepcion.request.put("/api/ventana-de-llegada", { data: ventanaAmplia })).status()).toBe(403);
  } finally {
    await contexto.close();
  }
});
