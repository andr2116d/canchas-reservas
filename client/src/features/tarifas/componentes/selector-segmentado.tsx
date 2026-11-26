"use client";

const OPCION =
  "rounded-[0.6rem] px-2.5 py-1.5 text-[0.8rem] font-bold text-grava transition-colors hover:text-botella " +
  "aria-pressed:bg-papel aria-pressed:text-botella aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-botella";

interface SelectorSegmentadoProps<T extends string> {
  nombre: string;
  opciones: { valor: T; texto: string; nombreAccesible?: string }[];
  valor: T;
  elegir: (valor: T) => void;
}

/** Elección entre pocas opciones, a un toque y con el ancho de su contenido. */
export function SelectorSegmentado<T extends string>({ nombre, opciones, valor, elegir }: SelectorSegmentadoProps<T>) {
  return (
    <div role="group" aria-label={nombre} className="flex w-fit max-w-full flex-wrap gap-0.5 rounded-xl bg-linea/55 p-[3px]">
      {opciones.map((opcion) => (
        <button key={opcion.valor} type="button" aria-pressed={valor === opcion.valor} aria-label={opcion.nombreAccesible} onClick={() => elegir(opcion.valor)} className={OPCION}>
          {opcion.texto}
        </button>
      ))}
    </div>
  );
}
