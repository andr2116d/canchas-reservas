import type { Compensacion } from "../servicios/cancelacion";

const FORMAS = { DINERO: "Dinero", CREDITO: "Crédito para otra reserva" } as const;

/** Lo que recibe el jugador y de dónde sale: parte del anticipo, lo pagado de más y lo retenido. */
export function ResultadoDeLaSimulacion({ compensacion, calculando, error }: { compensacion?: Compensacion; calculando: boolean; error?: string }) {
  if (error) return <p role="alert" className="text-sm font-semibold text-error">{error}</p>;
  if (!compensacion) return <p className="text-sm text-grava">{calculando ? "Calculando…" : "Corrige la regla para ver el resultado."}</p>;
  const filas = [
    [`${compensacion.porcentaje} % del anticipo`, compensacion.devolucionDelAnticipo],
    ["Lo pagado de más", compensacion.excedente],
    ["Se retiene", compensacion.retenido],
  ];
  return (
    <div aria-live="polite" className={`flex flex-col gap-2.5 rounded-2xl border border-linea bg-papel px-4 py-3.5 transition-opacity ${calculando ? "opacity-60" : ""}`}>
      <p className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-grava">Recibe</span>
        <b className="font-titular text-3xl font-black text-botella tabular-nums">S/ {compensacion.totalADevolver}</b>
      </p>
      <dl className="flex flex-col gap-0.5 text-[0.8rem] tabular-nums">
        {filas.map(([concepto, monto]) => (
          <div key={concepto} className="flex justify-between gap-3 text-grava">
            <dt>{concepto}</dt>
            <dd className="font-semibold text-tinta">S/ {monto}</dd>
          </div>
        ))}
      </dl>
      <p className="flex flex-wrap gap-1.5">
        {compensacion.formas.length === 0 ? (
          <span className="rounded-full bg-alerta/10 px-2.5 py-0.5 text-xs font-bold text-alerta">Se retiene el anticipo</span>
        ) : (
          compensacion.formas.map((forma) => (
            <span key={forma} className="rounded-full bg-tiza px-2.5 py-0.5 text-xs font-bold text-botella">{FORMAS[forma]}</span>
          ))
        )}
      </p>
    </div>
  );
}
