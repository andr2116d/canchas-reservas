import { VersionesAnteriores } from "@/compartido/ui/versiones-anteriores";
import type { VistaDeLaRegla } from "../servicios/cancelacion";

const resumen = (version: VistaDeLaRegla) =>
  version.rangos.map((rango) => `${rango.desdeHoras} h: ${rango.porcentaje} %${rango.ofreceCredito ? " o crédito" : ""}`).join(" · ");

/** Versiones anteriores de la regla de cancelación. */
export function HistorialDeLaRegla({ anteriores }: { anteriores: VistaDeLaRegla[] }) {
  return <VersionesAnteriores titulo="Reglas" versiones={anteriores} resumen={resumen} />;
}
