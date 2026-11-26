import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Un correo único para buscar en Mailpit lo que le llegó. */
export const correoUnico = () => `reclama.${randomUUID()}@gmail.com`;

/** Una hoja válida por la API, para preparar lo que se prueba después. Devuelve su número y código. */
export async function registrarHojaPorApi(request: APIRequestContext, cambios: Record<string, unknown> = {}) {
  const respuesta = await request.post("/api/libro-de-reclamaciones", {
    data: {
      tipoDocumento: "DNI",
      numeroDocumento: "45871236",
      nombres: "Valeria",
      apellidos: `León ${randomUUID().slice(0, 6)}`,
      domicilio: "Av. América Sur 1250, Trujillo",
      telefono: "987654321",
      correo: correoUnico(),
      esMenorDeEdad: false,
      servicio: "RESERVA_DE_CANCHA",
      montoReclamado: "40",
      tipo: "RECLAMO",
      detalle: "La cancha estaba ocupada al llegar.",
      pedido: "Que devuelvan el adelanto.",
      medioDeRespuesta: "CORREO",
      ...cambios,
    },
  });
  expect(respuesta.status()).toBe(201);
  return (await respuesta.json()) as { numero: string; codigo: string };
}

const campo = (pagina: Page, etiqueta: string) => pagina.getByLabel(new RegExp(`^${etiqueta}`));

/** Llena los tres pasos de la hoja en pantalla, sin enviarla. */
export async function llenarHoja(pagina: Page, correo: string) {
  await campo(pagina, "Número de documento").fill("45871236");
  await campo(pagina, "Nombres").fill("Valeria");
  await campo(pagina, "Apellidos").fill("León Paredes");
  await campo(pagina, "Domicilio").fill("Av. América Sur 1250, Trujillo");
  await campo(pagina, "Teléfono").fill("044 123456");
  await campo(pagina, "Correo").fill(correo);
  await pagina.getByRole("button", { name: "Continuar" }).click();
  await pagina.getByText("Reserva de cancha", { exact: true }).click();
  await campo(pagina, "Monto reclamado").fill("40");
  await pagina.getByRole("button", { name: "Continuar" }).click();
  await pagina.getByRole("radio", { name: /Reclamo/ }).check();
  await campo(pagina, "¿Qué pasó\\?").fill("La cancha estaba ocupada al llegar y no pudimos jugar.");
  await campo(pagina, "¿Qué pides\\?").fill("Que devuelvan el adelanto completo.");
  await pagina.getByText("Por correo", { exact: true }).click();
  await pagina.getByRole("checkbox", { name: /Confirmo que mis datos son correctos/ }).check();
}

/** Los asuntos de los correos que recibió una dirección en Mailpit, esperando a que lleguen. */
export async function asuntosRecibidos(request: APIRequestContext, direccion: string, cantidad = 1): Promise<string[]> {
  let asuntos: string[] = [];
  await expect
    .poll(async () => {
      const respuesta = await request.get(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:"${direccion}"`)}`);
      asuntos = ((await respuesta.json()) as { messages: { Subject: string }[] }).messages.map((m) => m.Subject);
      return asuntos.length;
    }, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(cantidad);
  return asuntos;
}
