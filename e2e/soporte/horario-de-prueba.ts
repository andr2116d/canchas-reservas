import type { Locator } from "@playwright/test";

/** Escribe una hora «HH:MM» en el marcador de la etiqueta dada, dentro de la zona. */
export async function ponerHora(zona: Locator, etiqueta: string, hora: string) {
  const [horas, minutos] = hora.split(":");
  await zona.getByRole("spinbutton", { name: `Horas de ${etiqueta}` }).first().fill(horas);
  await zona.getByRole("spinbutton", { name: `Minutos de ${etiqueta}` }).first().fill(minutos);
}
