import type { EstadoDelListado } from "../servicios/ficha-de-recepcionista";
import { listarRecepcionistas } from "../servicios/recepcionistas.servidor";
import { ListadoDeRecepcionistas } from "./listado-de-recepcionistas";

/** Lee el estado pedido en la dirección y muestra esas recepcionistas. */
export async function RecepcionistasDelEstado({ parametros }: { parametros: Promise<{ estado?: string | string[] }> }) {
  const { estado: pedido } = await parametros;
  const estado: EstadoDelListado = pedido === "desactivadas" ? "desactivadas" : "activas";
  return <ListadoDeRecepcionistas estado={estado} fichas={await listarRecepcionistas(estado)} />;
}
