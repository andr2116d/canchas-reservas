import { type Browser, expect, type Page } from "@playwright/test";
import { quitarTarifaDe } from "./base-de-pruebas";
import { registrarPorApi } from "./jugador-de-prueba";
import { entrarComoAdministrador } from "./sesiones-de-prueba";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const CANCHAS = [
  { nombre: "Disp Uno", tipo: "FUTBOL_5", tieneIluminacion: true },
  { nombre: "Disp Dos", tipo: "FUTBOL_5", tieneIluminacion: false },
  { nombre: "Disp Siete", tipo: "FUTBOL_7", tieneIluminacion: true },
  { nombre: "Disp Apagada", tipo: "FUTBOL_5", tieneIluminacion: true },
] as const;

export type CanchasDelLocal = Record<(typeof CANCHAS)[number]["nombre"], number>;

const FORMATO_DE_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });

/** La fecha `AAAA-MM-DD` de Lima, desde hoy más los días dados. */
export const fechaDeLima = (dias = 0) => FORMATO_DE_LIMA.format(new Date(Date.now() + dias * 24 * 60 * 60 * 1000));

async function guardar(pagina: Page, metodo: "put" | "post", ruta: string, datos: object) {
  const respuesta = await pagina.request[metodo](ruta, { data: datos });
  expect(respuesta.ok(), `${ruta} respondió ${respuesta.status()}`).toBe(true);
  return respuesta;
}

/** Crea las canchas que falten y desactiva la que debe quedar fuera del mapa. */
async function prepararCanchas(admin: Page): Promise<CanchasDelLocal> {
  const existentes = (await (await admin.request.get("/api/canchas")).json()) as { id: number; nombre: string; estado: string }[];
  const faltan = CANCHAS.filter((c) => !existentes.some((e) => e.nombre === c.nombre));
  if (faltan.length > 0) {
    await guardar(admin, "post", "/api/canchas", { canchas: faltan.map((c) => ({ ...c, caracteristicas: [], nota: "" })) });
  }
  const todas = (await (await admin.request.get("/api/canchas")).json()) as { id: number; nombre: string; estado: string }[];
  const ids = Object.fromEntries(CANCHAS.map((c) => [c.nombre, todas.find((e) => e.nombre === c.nombre)!.id])) as CanchasDelLocal;
  if (todas.find((c) => c.id === ids["Disp Apagada"])?.estado === "OPERATIVA") {
    await admin.request.post(`/api/canchas/${ids["Disp Apagada"]}/desactivacion`);
  }
  return ids;
}

/**
 * Deja el local listo para mirar turnos: abre todos los días de 00:30 a 23:30 con noche
 * desde las 18:00, fútbol 5 a S/ 60 de día y S/ 80 de noche, adelanto de 50 % y fútbol 7
 * sin tarifa. También registra un jugador, que será el titular de las reservas de prueba.
 */
export async function prepararElLocal(navegador: Browser): Promise<CanchasDelLocal> {
  await registrarUnJugador(navegador);
  const contexto = await navegador.newContext();
  const admin = await contexto.newPage();
  await entrarComoAdministrador(admin);
  await guardar(admin, "put", "/api/horario", {
    inicioDeLaNoche: "18:00",
    dias: DIAS.map((dia) => ({ dia, abierto: true, abre: "00:30", cierra: "23:30" })),
  });
  await guardar(admin, "put", "/api/tarifas/FUTBOL_5", { precioDia: "60", precioNoche: "80", duracionDelTurno: "1", ofreceTurnoCorto: false });
  await guardar(admin, "put", "/api/adelanto", { porcentaje: "50" });
  await quitarTarifaDe("futbol_7");
  const canchas = await prepararCanchas(admin);
  await contexto.close();
  return canchas;
}

async function registrarUnJugador(navegador: Browser) {
  const delJugador = await navegador.newContext();
  await registrarPorApi(delJugador.request);
  await delJugador.close();
}
