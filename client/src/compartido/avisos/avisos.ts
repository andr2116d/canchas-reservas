import { enviarJson, type RespuestaDeLaApi } from "../api/enviar-json";

export type TipoDeAviso = "NUEVO_RECLAMO" | "RECLAMO_RESPONDIDO";

export interface Aviso {
  id: number;
  tipo: TipoDeAviso;
  referencia: string;
  creadoEn: string;
  leido: boolean;
}

export interface AvisosPropios {
  sinLeer: number;
  avisos: Aviso[];
}

export function consultarAvisos(): Promise<RespuestaDeLaApi<AvisosPropios>> {
  return enviarJson<AvisosPropios>("/api/avisos", "GET");
}

export function marcarAvisoLeido(id: number): Promise<RespuestaDeLaApi<undefined>> {
  return enviarJson(`/api/avisos/${id}/lectura`, "POST");
}

export function marcarTodosLeidos(): Promise<RespuestaDeLaApi<undefined>> {
  return enviarJson("/api/avisos/lectura", "POST");
}

/** El texto y el destino de cada tipo de aviso; la API solo manda el tipo y la referencia. */
export function describirAviso({ tipo, referencia }: Pick<Aviso, "tipo" | "referencia">): { titulo: string; enlace: string } {
  if (tipo === "NUEVO_RECLAMO") return { titulo: `Nueva hoja de reclamación ${referencia}`, enlace: `/administracion/reclamos/${referencia}` };
  return { titulo: `Respondimos tu hoja ${referencia}`, enlace: `/inicio/reclamos/${referencia}` };
}
