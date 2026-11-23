"use client";

const OPCION =
  "cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold text-grava transition-colors " +
  "has-checked:bg-papel has-checked:text-botella has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-botella";

interface SelectorSegmentadoProps<T extends string> {
  leyenda: string;
  nombre: string;
  opciones: { valor: T; texto: string; nombreAccesible?: string }[];
  valor: T;
  elegir: (valor: T) => void;
}

/** Elección entre pocas opciones, a un toque y sin lista desplegable. */
export function SelectorSegmentado<T extends string>({ leyenda, nombre, opciones, valor, elegir }: SelectorSegmentadoProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">{leyenda}</legend>
      <div className="flex flex-wrap gap-1 rounded-xl bg-linea/60 p-1">
        {opciones.map((opcion) => (
          <label key={opcion.valor} className={`${OPCION} flex-1`}>
            <input type="radio" name={nombre} value={opcion.valor} checked={valor === opcion.valor} onChange={() => elegir(opcion.valor)} aria-label={opcion.nombreAccesible} className="sr-only" />
            {opcion.texto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
