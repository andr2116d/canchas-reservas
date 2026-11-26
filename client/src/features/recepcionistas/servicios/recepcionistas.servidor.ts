import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { EstadoDelListado, FichaConHistorial, FichaDeRecepcionista } from "./ficha-de-recepcionista";

const ERROR_DE_CARGA = "No pudimos cargar las recepcionistas.";

export function listarRecepcionistas(estado: EstadoDelListado): Promise<FichaDeRecepcionista[]> {
  return consultarPaginaPrivada(`recepcionistas?estado=${estado}`, ERROR_DE_CARGA);
}

export function obtenerFicha(id: string): Promise<FichaConHistorial> {
  return consultarPaginaPrivada(`recepcionistas/${encodeURIComponent(id)}`, ERROR_DE_CARGA);
}
