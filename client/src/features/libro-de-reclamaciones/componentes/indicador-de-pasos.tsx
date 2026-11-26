/**
 * Dónde está la persona en la hoja: los pasos hechos llevan un visto y el actual se marca. En el
 * celular solo se ven las barras y «Paso N de 3»; el título del paso va en el encabezado.
 */
export function IndicadorDePasos({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <div className="flex flex-col gap-2">
      <ol className="grid grid-cols-3 gap-2" aria-label="Pasos de la hoja">
        {pasos.map((titulo, indice) => {
          const estado = indice < actual ? "hecho" : indice === actual ? "actual" : "pendiente";
          return (
            <li key={titulo} aria-current={estado === "actual" ? "step" : undefined} className="flex flex-col gap-2">
              <span className={`h-1.5 rounded-full ${estado === "pendiente" ? "bg-linea" : "bg-botella"}`} />
              <span className={`flex items-center gap-1.5 text-sm font-bold max-sm:sr-only ${estado === "pendiente" ? "text-grava" : "text-botella"}`}>
                <span aria-hidden="true">{estado === "hecho" ? "✓" : indice + 1}</span>
                {titulo}
                {estado === "hecho" && <span className="sr-only">(completo)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p aria-hidden="true" className="text-xs font-bold text-botella sm:hidden">
        Paso {actual + 1} de {pasos.length}
      </p>
    </div>
  );
}
