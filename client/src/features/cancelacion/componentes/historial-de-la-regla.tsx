import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import type { VistaDeLaRegla } from "../servicios/cancelacion";

const resumen = (version: VistaDeLaRegla) =>
  version.rangos.map((rango) => `${rango.desdeHoras} h: ${rango.porcentaje} %${rango.ofreceCredito ? " o crédito" : ""}`).join(" · ");

/** Versiones anteriores de la regla, plegadas: qué valores tenía, quién la guardó y cuándo. */
export function HistorialDeLaRegla({ anteriores }: { anteriores: VistaDeLaRegla[] }) {
  if (anteriores.length === 0) return null;
  return (
    <details className="border-t border-linea pt-4 text-sm">
      <summary className="cursor-pointer font-semibold text-botella">Reglas anteriores ({anteriores.length})</summary>
      <ol className="mt-3 flex flex-col gap-3 border-l-2 border-linea pl-4">
        {anteriores.map((version) => (
          <li key={version.guardadaEn} className="flex flex-col">
            <span className="font-semibold text-tinta tabular-nums">{resumen(version)}</span>
            <span className="text-grava">
              <time dateTime={version.guardadaEn}>{fechaEnLima(version.guardadaEn)}</time> · por {version.guardadaPor}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
