import { expect, type Page, test } from "@playwright/test";
import { unJugadorNuevo } from "../soporte/jugador-de-prueba";
import { entrarComoAdministrador } from "../soporte/recepcionistas-de-prueba";

// Las tarifas son del local entero: cada proyecto usa un tipo de cancha propio
// y las pruebas del archivo van en orden para no pisarse.
test.describe.configure({ mode: "serial" });

const TIPOS = {
  escritorio: { valor: "FUTBOL_7", nombre: "Fútbol 7" },
  celular: { valor: "FUTBOL_5", nombre: "Fútbol 5" },
} as const;

function tipoDelProyecto(nombreDelProyecto: string) {
  return TIPOS[nombreDelProyecto as keyof typeof TIPOS];
}

function tarjetaDe(pagina: Page, nombre: string) {
  return pagina.getByRole("region", { name: nombre });
}

async function abrirTarifas(pagina: Page) {
  await entrarComoAdministrador(pagina);
  await pagina.getByRole("link", { name: "Tarifas" }).first().click();
  await expect(pagina).toHaveURL("/administracion/tarifas");
}

async function escribirTarifa(pagina: Page, nombre: string, valores: { dia: string; noche: string; horas: string }) {
  const tarjeta = tarjetaDe(pagina, nombre);
  await tarjeta.getByLabel(/^Precio de día/).fill(valores.dia);
  await tarjeta.getByLabel(/^Precio de noche/).fill(valores.noche);
  await tarjeta.getByLabel(/^Duración del turno/).fill(valores.horas);
  await tarjeta.getByRole("button", { name: `Guardar tarifa de ${nombre.toLowerCase()}` }).click();
}

test("el administrador define el precio de día, el de noche y la duración del turno de un tipo", async ({ page }, info) => {
  const { nombre } = tipoDelProyecto(info.project.name);
  await abrirTarifas(page);

  await escribirTarifa(page, nombre, { dia: "50", noche: "100", horas: "3" });

  const tarjeta = tarjetaDe(page, nombre);
  await expect(tarjeta.getByRole("status")).toContainText("Rige para las reservas nuevas");
  await expect(tarjeta.getByText(/Vigente desde .* por Valeria León Paredes/)).toBeVisible();
  await page.reload();
  await expect(tarjetaDe(page, nombre).getByLabel(/^Precio de noche/)).toHaveValue("100.00");
});

test("no acepta montos en cero, negativos ni que no son números", async ({ page }, info) => {
  const { nombre, valor } = tipoDelProyecto(info.project.name);
  await abrirTarifas(page);
  const tarjeta = tarjetaDe(page, nombre);

  await tarjeta.getByLabel(/^Precio de día/).fill("");
  await tarjeta.getByLabel(/^Precio de día/).pressSequentially("-a5b0");
  await expect(tarjeta.getByLabel(/^Precio de día/)).toHaveValue("50");
  await tarjeta.getByLabel(/^Precio de noche/).fill("0");
  await tarjeta.getByRole("button", { name: /^Guardar tarifa/ }).click();
  await expect(tarjeta.getByText("El monto debe ser mayor que cero.")).toBeVisible();

  const respuesta = await page.request.put(`/api/tarifas/${valor}`, {
    data: { precioDia: "-5", precioNoche: "cien", duracionDelTurno: "3" },
  });
  expect(respuesta.status()).toBe(400);
});

test("permite el mismo precio de día y de noche, y guardar sin cambios no crea otra versión", async ({ page }, info) => {
  const { nombre } = tipoDelProyecto(info.project.name);
  await abrirTarifas(page);

  await escribirTarifa(page, nombre, { dia: "60", noche: "60", horas: "1" });
  await expect(tarjetaDe(page, nombre).getByRole("status")).toContainText("Tarifa guardada");
  await escribirTarifa(page, nombre, { dia: "60.00", noche: "60", horas: "1" });

  await expect(tarjetaDe(page, nombre).getByRole("status")).toContainText("No había cambios");
});

test("cada cambio queda en las tarifas anteriores con quién y cuándo", async ({ page }, info) => {
  const { nombre } = tipoDelProyecto(info.project.name);
  await abrirTarifas(page);
  await escribirTarifa(page, nombre, { dia: "45", noche: "80", horas: "2" });
  await expect(tarjetaDe(page, nombre).getByRole("status")).toContainText("Tarifa guardada");
  await page.reload();

  const tarjeta = tarjetaDe(page, nombre);
  await tarjeta.getByText(/^Tarifas anteriores/).click();
  await expect(tarjeta.getByText("Día S/ 60.00 · Noche S/ 60.00 · Turno de 1 hora")).toBeVisible();
});

test("el simulador calcula el valor de un turno que cruza a la noche, con su desglose", async ({ page }, info) => {
  const { nombre } = tipoDelProyecto(info.project.name);
  await abrirTarifas(page);
  await escribirTarifa(page, nombre, { dia: "50", noche: "100", horas: "3" });
  await expect(tarjetaDe(page, nombre).getByRole("status")).toBeVisible();

  const simulador = page.getByRole("region", { name: "Simular el valor de un turno" });
  await simulador.getByText(nombre, { exact: true }).click();
  await simulador.getByLabel("Hora de inicio").fill("17:00");
  await simulador.getByRole("button", { name: "Calcular" }).click();

  await expect(simulador.getByText("S/ 83.33")).toBeVisible();
  await expect(simulador.getByText("Día · 17:00 a 18:00")).toBeVisible();
  await expect(simulador.getByText("Noche · 18:00 a 20:00")).toBeVisible();
});

test("solo administración define las tarifas", async ({ page }) => {
  const jugador = unJugadorNuevo();
  await page.request.post("/api/jugadores", {
    data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: "registro-1" },
  });

  const respuesta = await page.request.put("/api/tarifas/FUTBOL_7", {
    data: { precioDia: "1", precioNoche: "1", duracionDelTurno: "1" },
  });
  expect(respuesta.status()).toBe(403);
  await page.goto("/administracion/tarifas");
  await expect(page.getByRole("heading", { name: "Esta zona no es para tu cuenta" })).toBeVisible();
});
