import { enviarJson, type RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import type { TurnoElegido } from "@/compartido/sesion/turno-elegido";
import type { cobroParaEnviar, DatosDeAlta, DatosDeBusqueda } from "../esquemas/recepcion.schema";
import type { ResumenDeReserva } from "./reservas";

export interface ClienteDeRecepcion {
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

export type ResumenDeRecepcion = Omit<ResumenDeReserva, "adicionales">;

export interface ReservaDeRecepcion {
  codigo: string;
  estado: "CONFIRMADA" | "PENDIENTE_DE_PAGO";
  venceEn: string | null;
}

export function buscarClientes({ por, tipoDocumento, numeroDocumento, celular }: DatosDeBusqueda) {
  return enviarJson<ClienteDeRecepcion[]>("/api/recepcion/clientes/buscar", "POST", por === "celular" ? { celular } : { tipoDocumento, numeroDocumento });
}

export function registrarCliente(datos: DatosDeAlta) {
  return enviarJson<{ cliente: ClienteDeRecepcion; existente: boolean }>("/api/recepcion/clientes", "POST", datos);
}

export function consultarResumenDeRecepcion({ canchaId, fecha, desde }: TurnoElegido, titularId: number, senal: AbortSignal) {
  const parametros = new URLSearchParams({ canchaId: String(canchaId), fecha, desde, titularId: String(titularId) });
  return enviarJson<ResumenDeRecepcion>(`/api/recepcion/reservas/resumen?${parametros}`, "GET", undefined, senal);
}

export function reservarDesdeRecepcion(turno: TurnoElegido, titularId: number, { precio, adelanto }: ResumenDeRecepcion, cobro: ReturnType<typeof cobroParaEnviar>) {
  return enviarJson<ReservaDeRecepcion>("/api/recepcion/reservas", "POST", { ...turno, titularId, precio, adelanto, cobro });
}

export function mensajeDeRecepcion<T>(respuesta: Exclude<RespuestaDeLaApi<T>, { tipo: "aceptado" }>) {
  return (respuesta.tipo === "rechazado" ? Object.values(respuesta.errores)[0] : undefined) ?? respuesta.mensaje;
}
