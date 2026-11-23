import type { Tramo, ValorCalculado } from "../servicios/tarifas";
import { horas } from "../utilidades/horas";

const NOMBRE_DE_LA_FRANJA: Record<Tramo["franja"], string> = { DIA: "Día", NOCHE: "Noche" };

/** Total del turno y cuánto aporta cada franja, para entender de dónde sale el precio. */
export function DesgloseDelValor({ valor }: { valor: ValorCalculado }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-tiza px-5 py-4">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-grava">Turno de {horas(valor.duracionDelTurnoHoras)}</span>
        <span className="font-titular text-4xl font-black text-botella tabular-nums">S/ {valor.total}</span>
      </p>
      <ul className="flex flex-col gap-1 border-t border-linea pt-3 text-sm">
        {valor.tramos.map((tramo) => (
          <li key={tramo.franja} className="flex justify-between gap-4">
            <span className="text-tinta">{`${NOMBRE_DE_LA_FRANJA[tramo.franja]} · ${tramo.desde} a ${tramo.hasta}`}</span>
            <span className="font-semibold text-tinta tabular-nums">S/ {tramo.monto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
