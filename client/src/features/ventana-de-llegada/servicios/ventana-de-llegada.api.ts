import { enviarJson } from "@/compartido/api/enviar-json";
import type { LimitesDeLlegada } from "./ventana-de-llegada";

export function guardarVentanaDeLlegada(limites: LimitesDeLlegada) {
  return enviarJson<{ cambio: boolean }>("/api/ventana-de-llegada", "PUT", limites);
}
