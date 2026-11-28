import { enviarJson } from "@/compartido/api/enviar-json";
import type { cobroParaEnviar } from "../esquemas/recepcion.schema";

type CheckInPrevio = { tipo: "ya-realizado"; codigo: string; checkInEn: string };
export type CheckInRealizado = CheckInPrevio | { tipo: "realizado"; codigo: string; checkInEn: string };
export type DetalleDelCheckIn =
  | { tipo: "listo"; codigo: string; precio: string; pagado: string; saldo: string }
  | CheckInPrevio;

const ruta = (codigo: string) => `/api/recepcion/reservas/${encodeURIComponent(codigo)}/check-in`;

export function consultarCheckIn(codigo: string, senal: AbortSignal) {
  return enviarJson<DetalleDelCheckIn>(ruta(codigo), "GET", undefined, senal);
}

export function registrarCheckIn(codigo: string, cobro: ReturnType<typeof cobroParaEnviar>) {
  return enviarJson<CheckInRealizado>(ruta(codigo), "POST", cobro ?? {});
}
