import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { datosDeReserva } from "../../soporte/base-de-pruebas";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { type CanchasDelLocal, fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { abrirElDia, celda, tuTurno } from "../../soporte/mapa-de-prueba";
import { altaPorRecepcion, buscarDocumento, campo, cobrosDeReserva, datosDeCliente, datosDelAviso, llenarAlta, pedirDesdeRecepcion, reservarPorRecepcion, rutaDeReservaEnRecepcion } from "../../soporte/recepcion-de-prueba";
import { entrarComoRecepcion } from "../../soporte/recepcionistas-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

let recepcion: BrowserContext;
let administracion: BrowserContext;
let canchas: CanchasDelLocal;
let fecha: string;
let pagina: Page;
let recepcionistaId: number;

const efectivo = { monto: "30.00", metodo: "EFECTIVO" } as const;
const turno = (desde: string, nombre: keyof CanchasDelLocal = "Disp Uno", dia = fecha) => ({ canchaId: canchas[nombre], fecha: dia, desde });
const operacion = () => randomUUID();
const api = () => recepcion.request;
const alta = async () => (await altaPorRecepcion(api())).cliente.id;
const nombre = (datos: ReturnType<typeof datosDeCliente>) => `${datos.nombres} ${datos.apellidos} · DNI ${datos.numeroDocumento}`;

async function elegirCliente(desde: string, datos = datosDeCliente()) {
  const { cliente } = await altaPorRecepcion(api(), datos);
  await pagina.goto(rutaDeReservaEnRecepcion(turno(desde)));
  await buscarDocumento(pagina, datos.numeroDocumento);
  await pagina.getByRole("button", { name: nombre(datos) }).click();
  await expect(pagina.getByRole("heading", { name: "Confirmar reserva" })).toBeVisible();
  return cliente.id;
}

test.beforeAll(async ({ browser }, info) => {
  fecha = fechaDeLima(info.project.name.includes("celular") ? 19 : 18);
  canchas = await prepararElLocal(browser);
  administracion = await browser.newContext();
  await entrarComoAdministrador(await administracion.newPage());
  const regla = await administracion.request.put("/api/cancelacion/regla", { data: { rangos: [
    { desdeHoras: "24", porcentaje: "100", ofreceCredito: true }, { desdeHoras: "0", porcentaje: "0", ofreceCredito: false },
  ] } });
  expect(regla.ok()).toBe(true);
  recepcion = await browser.newContext();
  recepcionistaId = (await entrarComoRecepcion(await recepcion.newPage())).id;
});

test.beforeEach(async () => { pagina = await recepcion.newPage(); });
test.afterEach(async () => { await pagina?.close(); });
test.afterAll(async () => { await recepcion?.close(); await administracion?.close(); });

test("1. busca al cliente por documento o celular y muestra su identidad", async () => {
  const datos = datosDeCliente();
  await altaPorRecepcion(api(), datos);
  await pagina.goto(rutaDeReservaEnRecepcion(turno("08:30")));
  await buscarDocumento(pagina, datos.numeroDocumento);
  await expect(pagina.getByRole("button", { name: nombre(datos) })).toBeVisible();
  await pagina.getByRole("radio", { name: "Celular" }).check();
  await campo(pagina, "Número de celular").fill(datos.celular);
  await pagina.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(pagina.getByRole("button", { name: nombre(datos) })).toBeVisible();
});

test("2. registra a un titular mayor de edad con sus datos y correo opcional", async () => {
  const datos = { ...datosDeCliente(), correo: "" };
  await pagina.goto(rutaDeReservaEnRecepcion(turno("08:30")));
  await buscarDocumento(pagina, datos.numeroDocumento);
  await pagina.getByRole("button", { name: "Registrar cliente" }).click();
  await llenarAlta(pagina, { ...datos, fechaNacimiento: fechaDeLima() });
  await pagina.getByRole("checkbox", { name: /Informé al cliente/ }).check();
  await pagina.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(pagina.getByText("Debe tener al menos 18 años.")).toBeVisible();
  await campo(pagina, "Fecha de nacimiento").fill(datos.fechaNacimiento);
  await pagina.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(pagina.getByText(nombre(datos), { exact: true })).toBeVisible();
});

test("3. un alta simultánea usa la cuenta existente e informa el duplicado", async () => {
  const datos = datosDeCliente();
  await pagina.goto(rutaDeReservaEnRecepcion(turno("08:30")));
  await buscarDocumento(pagina, datos.numeroDocumento);
  await pagina.getByRole("button", { name: "Registrar cliente" }).click();
  const alta = await altaPorRecepcion(api(), datos);
  await llenarAlta(pagina, datos);
  await pagina.getByRole("checkbox", { name: /Informé al cliente/ }).check();
  await pagina.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(pagina.getByText(/Se usará la cuenta existente/)).toBeVisible();
  expect(await altaPorRecepcion(api(), datos)).toMatchObject({ cliente: { id: alta.cliente.id }, existente: true });
});

test("4. exige el aviso de privacidad y deja constancia de canal, fecha y autor", async () => {
  const datos = datosDeCliente();
  const rechazo = await api().post("/api/recepcion/clientes", { data: { ...datos, versionDelAviso: "" } });
  expect(rechazo.status()).toBe(400);
  const { cliente } = await altaPorRecepcion(api(), datos);
  expect(await datosDelAviso(cliente.id)).toEqual(expect.objectContaining({ canal: "recepcion", rol: "recepcionista", fecha: expect.any(Date), contrasena: null, version: datos.versionDelAviso }));
});

test("5. el mapa de recepción inicia el proceso solo para turnos reservables", async () => {
  await abrirElDia(pagina, fecha, "/recepcion/disponibilidad");
  await celda(pagina, "Disp Uno", "08:30").click();
  await tuTurno(pagina).getByRole("link", { name: /Reservar Disp Uno/ }).click();
  await expect(pagina).toHaveURL(rutaDeReservaEnRecepcion(turno("08:30")));
  const id = await alta();
  for (const noDisponible of [turno("19:30", "Disp Dos"), turno("08:30", "Disp Apagada"), turno("08:30", "Disp Uno", fechaDeLima(-1)), turno("08:30", "Disp Uno", fechaDeLima(31))]) {
    expect((await pedirDesdeRecepcion(api(), noDisponible, id)).ok()).toBe(false);
  }
});

test("6. muestra precio con IGV, adelanto mínimo y regla, con precio proporcional al cruzar la noche", async () => {
  await elegirCliente("17:30");
  await expect(pagina.getByText("S/ 70.00", { exact: true })).toBeVisible();
  await expect(pagina.getByText("S/ 35.00", { exact: true })).toBeVisible();
  await expect(pagina.getByRole("region", { name: "Si cancelas" })).toContainText("Se devuelve el 100 % del adelanto");
});

test("7. la reserva guarda el precio, porcentaje y versión vigentes al crearla", async () => {
  const { codigo } = await reservarPorRecepcion(api(), turno("08:30"), await alta(), efectivo);
  await administracion.request.put("/api/adelanto", { data: { porcentaje: "60" } });
  try {
    const guardada = await datosDeReserva(codigo);
    expect(guardada).toMatchObject({ precio: "60.00", porcentaje: 50, adelanto: "30.00", reglaId: guardada.reglaVigenteId });
  } finally {
    await administracion.request.put("/api/adelanto", { data: { porcentaje: "50" } });
  }
});

test("8. una disputa por el turno deja una sola reserva y avisa que se elija otro", async () => {
  const id = await elegirCliente("09:30");
  const otra = await alta();
  const respuestas = await Promise.all([pedirDesdeRecepcion(api(), turno("09:30"), id, efectivo), pedirDesdeRecepcion(api(), turno("09:30"), otra, efectivo)]);
  expect(respuestas.map((respuesta) => respuesta.status()).sort((a, b) => a - b)).toEqual([201, 409]);
  await campo(pagina, "Método de pago").selectOption("EFECTIVO");
  await pagina.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(pagina.getByText(/ya no está libre/)).toBeVisible();
});

test("9. registra un adelanto en efectivo, Yape o Plin", async () => {
  const id = await alta();
  for (const [desde, metodo] of [["10:30", "EFECTIVO"], ["11:30", "YAPE"], ["12:30", "PLIN"]] as const) {
    const numeroOperacion = metodo === "EFECTIVO" ? undefined : operacion();
    const { codigo } = await reservarPorRecepcion(api(), turno(desde), id, { monto: "30.00", metodo, numeroOperacion });
    expect(await cobrosDeReserva(codigo)).toMatchObject([{ monto: "30.00", metodo: metodo.toLowerCase(), operacion: numeroOperacion?.toUpperCase() ?? null }]);
  }
});

test("10. exige número electrónico e impide repetirlo en dos reservas", async () => {
  const id = await alta();
  const sinNumero = await pedirDesdeRecepcion(api(), turno("13:30"), id, { ...efectivo, metodo: "YAPE" });
  expect(sinNumero.status()).toBe(400);
  const cobro = { ...efectivo, metodo: "YAPE", numeroOperacion: operacion() } as const;
  const dos = await Promise.all([pedirDesdeRecepcion(api(), turno("13:30"), id, cobro), pedirDesdeRecepcion(api(), turno("14:30"), id, cobro)]);
  const ganador = await dos.find((r) => r.status() === 201)?.json();
  const duplicado = dos.find((r) => r.status() === 409);
  expect(ganador?.codigo).toBeTruthy();
  expect((await duplicado?.json())?.errores.numeroOperacion).toContain(ganador.codigo);
});

test("11. rechaza adelantos por debajo del mínimo y por encima del total", async () => {
  const id = await alta();
  for (const monto of ["29.99", "60.01"]) {
    const respuesta = await pedirDesdeRecepcion(api(), turno("15:30"), id, { ...efectivo, monto });
    expect(respuesta.status()).toBe(400);
    expect((await respuesta.json()).errores.monto).toMatch(/S\/ (30|60)\.00/);
  }
});

test("12. un adelanto válido confirma de inmediato desde la pantalla", async () => {
  await elegirCliente("15:30");
  await campo(pagina, "Método de pago").selectOption("EFECTIVO");
  await expect(campo(pagina, "Número de operación")).toHaveCount(0);
  await pagina.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(pagina.getByRole("heading", { name: "Reserva confirmada" })).toBeVisible();
});

test("13. sin adelanto no se crea la reserva desde recepción", async () => {
  const id = await elegirCliente("16:30");
  const respuesta = await pedirDesdeRecepcion(api(), turno("16:30"), id);
  expect(respuesta.status()).toBe(400);
  await pagina.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(campo(pagina, "Método de pago")).toBeVisible();
  await expect(pagina.getByText("Elige el método de pago.")).toBeVisible();
});

test("14. atribuye el adelanto a la caja de quien lo cobró", async () => {
  const { codigo } = await reservarPorRecepcion(api(), turno("17:30"), await alta(), { monto: "35.00", metodo: "EFECTIVO" }, { precio: "70.00", adelanto: "35.00" });
  expect(await cobrosDeReserva(codigo)).toMatchObject([{ concepto: "adelanto", autor: recepcionistaId, metodo: "efectivo", monto: "35.00", fecha: expect.any(Date) }]);
});

test("15. guarda el autor y el momento de la reserva en el historial como importante", async () => {
  const { codigo } = await reservarPorRecepcion(api(), turno("18:30"), await alta(), { monto: "45.00", metodo: "EFECTIVO" });
  const respuesta = await administracion.request.get(`/api/historial?categoria=RESERVAS&accion=SEPARACION&autor=${recepcionistaId}`);
  expect(respuesta.status(), await respuesta.text()).toBe(200);
  expect((await respuesta.json()).registros).toEqual(expect.arrayContaining([expect.objectContaining({
    sujeto: `Reserva ${codigo}`,
    importante: true,
    ocurridoEn: expect.any(String),
    autor: expect.objectContaining({ id: recepcionistaId }),
    detalle: expect.arrayContaining([expect.objectContaining({ campo: "Adelanto", despues: "S/ 45.00" })]),
  })]));
});

test("16. el mapa se actualiza y recepción y administración reciben el aviso", async () => {
  await abrirElDia(pagina, fecha, "/recepcion/disponibilidad");
  const celdaDelTurno = celda(pagina, "Disp Uno", "19:30");
  await expect(celdaDelTurno).toHaveText(/Libre/);
  const { codigo } = await reservarPorRecepcion(api(), turno("19:30"), await alta(), { monto: "40.00", metodo: "EFECTIVO" });
  await expect(celdaDelTurno).toHaveText("Ocupado", { timeout: 10_000 });
  for (const request of [api(), administracion.request]) {
    await expect.poll(async () => (await (await request.get("/api/avisos")).text()).includes(codigo)).toBe(true);
  }
});

test("seguridad. reserva, búsqueda y alta quedan restringidas a recepción", async ({ browser }) => {
  const contexto = await browser.newContext();
  try {
    const buscar = () => contexto.request.post("/api/recepcion/clientes/buscar", { data: { celular: datosDeCliente().celular } });
    expect((await buscar()).status()).toBe(401);
    await registrarPorApi(contexto.request);
    expect((await buscar()).status()).toBe(403);
    expect((await contexto.request.post("/api/recepcion/clientes", { data: datosDeCliente() })).status()).toBe(403);
    expect((await pedirDesdeRecepcion(contexto.request, turno("20:30"), 1)).status()).toBe(403);
  } finally {
    await contexto.close();
  }
});
