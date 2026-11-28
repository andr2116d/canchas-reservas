import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { datosDeReserva } from "../../soporte/base-de-pruebas";
import { ponerHora } from "../../soporte/horario-de-prueba";
import { registrarPorApi } from "../../soporte/jugador-de-prueba";
import { type CanchasDelLocal, fechaDeLima, prepararElLocal } from "../../soporte/local-de-prueba";
import { abrirElDia, celda } from "../../soporte/mapa-de-prueba";
import { separarPorApi } from "../../soporte/reserva-de-prueba";
import { entrarComoAdministrador } from "../../soporte/sesiones-de-prueba";

// Cambia el horario del local: corre al final de todo y en orden.
test.describe.configure({ mode: "serial" });

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const unHorario = (abre: string, cierra: string) => ({
  inicioDeLaNoche: "18:00",
  dias: DIAS.map((dia) => ({ dia, abierto: true, abre, cierra })),
});
const HORARIO_DEL_LOCAL = unHorario("00:30", "23:30");

let canchas: CanchasDelLocal;
let administracion: BrowserContext;
let codigo: string;
const fecha = fechaDeLima(9);

const horario = (pagina: Page) => pagina.getByRole("region", { name: "Horario de atención" });
const avisoDeReservasFuera = (pagina: Page) => horario(pagina).getByRole("region", { name: /fuera del nuevo horario$/ });
const guardarHorario = async (datos: object) => expect((await administracion.request.put("/api/horario", { data: { ...datos, confirmar: true } })).ok()).toBe(true);

async function cerrarALas22(pagina: Page) {
  await pagina.goto("/administracion/reglas-de-reserva");
  await pagina.getByRole("tab", { name: "Horario" }).click();
  await ponerHora(horario(pagina), "Cierra", "22:00");
  await horario(pagina).getByRole("button", { name: "Guardar horario" }).click();
}

test.beforeAll(async ({ browser }) => {
  canchas = await prepararElLocal(browser);
  administracion = await browser.newContext();
  await entrarComoAdministrador(await administracion.newPage());
  const regla = { rangos: [{ desdeHoras: "0", porcentaje: "100", ofreceCredito: false }] };
  expect((await administracion.request.put("/api/cancelacion/regla", { data: regla })).ok()).toBe(true);
  const jugador = await browser.newContext();
  await registrarPorApi(jugador.request);
  codigo = await separarPorApi(jugador.request, { canchaId: canchas["Disp Uno"], fecha, desde: "22:30" });
  await jugador.close();
});

test.afterAll(async () => {
  await guardarHorario(HORARIO_DEL_LOCAL);
  await administracion.close();
});

test("si el horario nuevo deja reservas fuera, avisa con cada cliente y no guarda hasta decidir", async () => {
  const pagina = await administracion.newPage();

  await cerrarALas22(pagina);

  const aviso = avisoDeReservasFuera(pagina);
  await expect(aviso).toContainText("No se anulan: el local las atiende igual. Avisa a cada cliente antes de guardar.");
  await expect(aviso.getByRole("listitem").filter({ hasText: codigo })).toContainText("22:30–23:30 · Disp Uno");
  await expect(aviso.getByRole("listitem").filter({ hasText: codigo })).toContainText("Valeria León Paredes");
  await aviso.getByRole("button", { name: "Revisar el horario" }).click();
  await expect(aviso).toBeHidden();
  const { vigente } = await (await administracion.request.get("/api/horario")).json();
  expect(vigente.dias[0].cierra).toBe("23:30");
  await pagina.close();
});

test("guardarlo igual respeta las reservas y lo deja en el historial como importante", async () => {
  const pagina = await administracion.newPage();
  await cerrarALas22(pagina);

  await avisoDeReservasFuera(pagina).getByRole("button", { name: "Guardar igual y respetar estas reservas" }).click();

  await expect(horario(pagina).getByRole("status")).toContainText("Horario guardado.");
  expect((await datosDeReserva(codigo)).estado).toBe("pendiente_de_pago");
  await pagina.goto("/administracion/historial?categoria=HORARIO");
  const registro = pagina.getByRole("listitem").filter({ hasText: "cambió el horario de atención" }).first();
  await expect(registro).toContainText("Importante");
  await registro.getByText("Ver qué cambió").click();
  await expect(registro.getByRole("row", { name: /Reservas que quedaron fuera y se respetan/ })).toContainText(codigo);
  await pagina.close();
  await guardarHorario(HORARIO_DEL_LOCAL);
});

test("si la reserva sigue dentro, los turnos nuevos que la pisan aunque sea en parte no se ofrecen", async ({ page }) => {
  await guardarHorario(unHorario("00:00", "24:00"));

  await abrirElDia(page, fecha);

  await expect(celda(page, "Disp Uno", "22:00")).toHaveText("Pendiente");
  await expect(celda(page, "Disp Uno", "23:00")).toHaveText("Pendiente");
  await expect(celda(page, "Disp Dos", "21:00")).not.toHaveText("Pendiente");
});
