import { expect, type Page } from "@playwright/test";

const DIA_LARGO = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Una fecha `AAAA-MM-DD` como la nombra la tira de días: «sábado, 5 de diciembre». */
export const diaLargo = (fecha: string) => DIA_LARGO.format(new Date(`${fecha}T00:00:00Z`));

export const mapa = (pagina: Page) => pagina.getByRole("table", { name: "Mapa de turnos" });
export const fila = (pagina: Page, hora: string) => mapa(pagina).getByRole("row").filter({ has: pagina.getByRole("rowheader", { name: new RegExp(`^${hora}`) }) });
export const celda = (pagina: Page, cancha: string, hora: string) => mapa(pagina).getByLabel(new RegExp(`^${cancha}, de ${hora} a`));
export const tuTurno = (pagina: Page) => pagina.getByRole("complementary", { name: "Tu turno" });

/** Abre el mapa y avanza por la tira de días hasta elegir la fecha dada. */
export async function abrirElDia(pagina: Page, fecha: string, ruta = "/") {
  await pagina.goto(ruta);
  const dia = pagina.getByRole("group", { name: "Fecha" }).getByRole("button", { name: diaLargo(fecha), exact: true });
  const siguientes = pagina.getByRole("button", { name: "Días siguientes" });
  await expect(siguientes).toBeVisible({ timeout: 15_000 });
  while (!(await dia.isVisible())) await siguientes.click();
  await dia.click();
  await expect(dia).toHaveAttribute("aria-pressed", "true");
  await expect(mapa(pagina)).toBeVisible({ timeout: 15_000 });
}
