import type { ReactNode } from "react";
import { fechaEnLima } from "./fecha-en-lima";

interface VersionesAnterioresProps<T> {
  /** Qué se versiona, en plural, como «Tarifas». */
  titulo: string;
  versiones: T[];
  /** Los valores de cada versión, en una línea. */
  resumen: (version: T) => ReactNode;
}

/** Versiones anteriores plegadas: qué valores tenía cada una, quién la guardó y cuándo. */
export function VersionesAnteriores<T extends { guardadaEn: string; guardadaPor: string }>({ titulo, versiones, resumen }: VersionesAnterioresProps<T>) {
  if (versiones.length === 0) return null;
  return (
    <details className="border-t border-linea pt-4 text-sm">
      <summary className="cursor-pointer font-semibold text-botella">{`${titulo} anteriores (${versiones.length})`}</summary>
      <ol className="mt-3 flex flex-col gap-3 border-l-2 border-linea pl-4">
        {versiones.map((version) => (
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
