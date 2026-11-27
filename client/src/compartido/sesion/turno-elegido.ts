import { PANELES } from "./destino-de-sesion";

/** El turno del mapa que alguien quiere reservar, guardado en la dirección para no perderlo. */
export interface TurnoElegido {
  canchaId: number;
  fecha: string;
  desde: string;
}

export const RUTA_DE_CONFIRMACION = "/inicio/reservar/confirmar";

// Los mismos topes que la API: ids `integer` de PostgreSQL, fechas AAAA-MM-DD y horas HH:MM.
const MAXIMO_ID = 2_147_483_647;
const ES_ID = /^\d{1,10}$/;
const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ES_HORA = /^\d{2}:\d{2}$/;

/** El turno de la dirección si tiene la forma correcta; si no, nada (se ignora). */
export function leerTurnoElegido(parametros: URLSearchParams): TurnoElegido | undefined {
  const [cancha, fecha, desde] = ["cancha", "fecha", "desde"].map((clave) => parametros.get(clave) ?? "");
  const canchaId = ES_ID.test(cancha) ? Number(cancha) : 0;
  if (canchaId < 1 || canchaId > MAXIMO_ID || !ES_FECHA.test(fecha) || !ES_HORA.test(desde)) return undefined;
  return { canchaId, fecha, desde };
}

/** La ruta con el turno en la dirección, o tal cual si no hay turno. */
export function conElTurno(ruta: string, turno?: TurnoElegido): string {
  if (!turno) return ruta;
  const parametros = new URLSearchParams({ cancha: String(turno.canchaId), fecha: turno.fecha, desde: turno.desde });
  return `${ruta}?${parametros.toString()}`;
}

/** Tras ingresar o crear la cuenta, el jugador que eligió un turno vuelve a confirmarlo. */
export function destinoConTurno(destino: string, turno?: TurnoElegido): string {
  return destino === PANELES.JUGADOR && turno ? conElTurno(RUTA_DE_CONFIRMACION, turno) : destino;
}

/** El turno de la dirección actual del navegador. */
export function turnoDeLaDireccion(): TurnoElegido | undefined {
  return typeof window === "undefined" ? undefined : leerTurnoElegido(new URLSearchParams(window.location.search));
}
