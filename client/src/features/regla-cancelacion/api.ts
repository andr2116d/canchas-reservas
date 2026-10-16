import { api } from "@/lib/api";

export type TipoCompensacion = "CREDITO" | "DEVOLUCION";

export type ReglaCancelacion = {
  horasAnticipacion: number;
  tipoCompensacion: TipoCompensacion;
};

export function obtenerRegla(): Promise<ReglaCancelacion> {
  return api<ReglaCancelacion>("/regla-cancelacion");
}

export function actualizarRegla(datos: ReglaCancelacion): Promise<ReglaCancelacion> {
  return api<ReglaCancelacion>("/regla-cancelacion", { method: "PUT", body: datos });
}
