import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { VentanaConsultada } from "./ventana-de-llegada";

export function consultarVentanaDeLlegada(): Promise<VentanaConsultada> {
  return consultarPaginaPrivada("ventana-de-llegada", "No pudimos cargar la ventana de llegada.");
}
