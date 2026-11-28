import { ESTADOS_DE_RESERVA, type EstadoDeReserva } from "../servicios/agenda";

/** Lo que se mira en la agenda; sin fecha, el server muestra hoy. */
export interface FiltrosDeLaAgenda {
  fecha?: string;
  canchaId?: string;
  estado?: EstadoDeReserva;
}

const MAXIMO_ID = 2_147_483_647;
const esFecha = (texto: string) => /^\d{4}-\d{2}-\d{2}$/.test(texto);
const esId = (texto: string) => /^\d{1,10}$/.test(texto) && Number(texto) >= 1 && Number(texto) <= MAXIMO_ID;
const esEstado = (texto: string): texto is EstadoDeReserva => (ESTADOS_DE_RESERVA as readonly string[]).includes(texto);

/** Lee la dirección con los mismos topes que la API; lo que no los cumple se ignora. */
export function leerFiltros(parametros: URLSearchParams): FiltrosDeLaAgenda {
  const fecha = parametros.get("fecha") ?? "";
  const cancha = parametros.get("cancha") ?? "";
  const estado = parametros.get("estado") ?? "";
  return {
    ...(esFecha(fecha) && { fecha }),
    ...(esId(cancha) && { canchaId: cancha }),
    ...(esEstado(estado) && { estado }),
  };
}

/** La consulta para `GET /api/agenda`. */
export function aConsulta({ fecha, canchaId, estado }: FiltrosDeLaAgenda): URLSearchParams {
  const consulta = new URLSearchParams();
  if (fecha) consulta.set("fecha", fecha);
  if (canchaId) consulta.set("canchaId", canchaId);
  if (estado) consulta.set("estado", estado);
  return consulta;
}

/** La dirección de la agenda con estos filtros; la cancha va como `cancha`, más corta de leer. */
export function aDireccion(ruta: string, filtros: FiltrosDeLaAgenda): string {
  const parametros = aConsulta(filtros);
  if (filtros.canchaId) {
    parametros.delete("canchaId");
    parametros.set("cancha", filtros.canchaId);
  }
  const texto = parametros.toString();
  return texto ? `${ruta}?${texto}` : ruta;
}
