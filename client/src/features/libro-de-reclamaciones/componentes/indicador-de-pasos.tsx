/** Dónde está la persona en la hoja: los pasos hechos llevan un visto y el actual se marca. */
export function IndicadorDePasos({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Pasos de la hoja">
      {pasos.map((titulo, indice) => {
        const estado = indice < actual ? "hecho" : indice === actual ? "actual" : "pendiente";
        return (
          <li key={titulo} aria-current={estado === "actual" ? "step" : undefined} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-full ${estado === "pendiente" ? "bg-linea" : "bg-botella"}`} />
            <span className={`flex items-center gap-1.5 text-xs font-bold sm:text-sm ${estado === "pendiente" ? "text-grava" : "text-botella"}`}>
              <span aria-hidden="true">{estado === "hecho" ? "✓" : indice + 1}</span>
              {titulo}
              {estado === "hecho" && <span className="sr-only">(completo)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
