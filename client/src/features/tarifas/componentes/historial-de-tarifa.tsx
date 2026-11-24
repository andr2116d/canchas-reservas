import { VersionesAnteriores } from "@/compartido/ui/versiones-anteriores";
import type { VistaDeTarifa } from "../servicios/tarifas";
import { horas } from "../utilidades/horas";

const resumen = (version: VistaDeTarifa) =>
  `Día S/ ${version.precioDia} · Noche S/ ${version.precioNoche} · Turno de ${horas(version.duracionDelTurnoHoras)}`;

/** Versiones anteriores de la tarifa de un tipo de cancha. */
export function HistorialDeTarifa({ anteriores }: { anteriores: VistaDeTarifa[] }) {
  return <VersionesAnteriores titulo="Tarifas" versiones={anteriores} resumen={resumen} />;
}
