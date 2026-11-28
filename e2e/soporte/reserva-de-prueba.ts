import { type APIRequestContext, expect } from "@playwright/test";

export interface TurnoDePrueba {
  canchaId: number;
  fecha: string;
  desde: string;
}

/** El local de prueba cobra S/ 60 de día y S/ 80 de noche (desde las 18:00), con 50 % de adelanto. */
export const montosDelTurno = (desde: string) => (desde >= "18:00" ? { precio: "80.00", adelanto: "40.00" } : { precio: "60.00", adelanto: "30.00" });

/** Pide separar el turno con la sesión de `request` y los montos del local; devuelve la respuesta. */
export function pedirSeparar(request: APIRequestContext, turno: TurnoDePrueba, adicionales: number[] = []) {
  return request.post("/api/reservas", { data: { ...turno, ...montosDelTurno(turno.desde), adicionales } });
}

/** Separa el turno con la sesión de `request` y devuelve el código de la reserva. */
export async function separarPorApi(request: APIRequestContext, turno: TurnoDePrueba, adicionales: number[] = []) {
  const respuesta = await pedirSeparar(request, turno, adicionales);
  expect(respuesta.status(), await respuesta.text()).toBe(201);
  return ((await respuesta.json()) as { codigo: string }).codigo;
}

/** La confirmación del turno, con el turno en la dirección como la arma el mapa. */
export const rutaDeConfirmacion = ({ canchaId, fecha, desde }: TurnoDePrueba) =>
  `/inicio/reservar/confirmar?${new URLSearchParams({ cancha: String(canchaId), fecha, desde })}`;

const MOMENTO = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Un instante como lo escribe la web en los plazos: «vie 27 nov, 19:00». */
export const momentoDelLocal = (instante: Date) => MOMENTO.format(instante).replace(/\./g, "").replace(/^(\S+),/, "$1");

/** El inicio de un turno de Lima (UTC−5 todo el año). */
export const inicioDelTurno = ({ fecha, desde }: Pick<TurnoDePrueba, "fecha" | "desde">) => new Date(`${fecha}T${desde}:00-05:00`);
