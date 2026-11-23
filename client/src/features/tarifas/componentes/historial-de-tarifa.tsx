import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import type { VistaDeTarifa } from "../servicios/tarifas";
import { horas } from "../utilidades/horas";

/** Versiones anteriores de la tarifa, plegadas: cada guardado queda con quién y cuándo. */
export function HistorialDeTarifa({ anteriores }: { anteriores: VistaDeTarifa[] }) {
  if (anteriores.length === 0) return null;
  return (
    <details className="border-t border-linea pt-4 text-sm">
      <summary className="cursor-pointer font-semibold text-botella">Tarifas anteriores ({anteriores.length})</summary>
      <ol className="mt-3 flex flex-col gap-3 border-l-2 border-linea pl-4">
        {anteriores.map((version) => (
          <li key={version.guardadaEn} className="flex flex-col">
            <span className="font-semibold text-tinta tabular-nums">
              Día S/ {version.precioDia} · Noche S/ {version.precioNoche} · Turno de {horas(version.duracionDelTurnoHoras)}
            </span>
            <span className="text-grava">
              <time dateTime={version.guardadaEn}>{fechaEnLima(version.guardadaEn)}</time> · por {version.guardadaPor}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
