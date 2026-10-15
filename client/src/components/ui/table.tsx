import { cn } from "@/lib/cn";
import { Card } from "./card";

export type ColumnaTabla<T> = {
  titulo: string;
  celda: (fila: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  claveFila: (fila: T) => string | number;
  etiqueta?: string;
};

export function Table<T>({ columnas, filas, claveFila, etiqueta }: Props<T>) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-linea bg-superficie shadow-sm md:block">
        <table className="w-full text-left" aria-label={etiqueta}>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.titulo} scope="col" className="px-4 py-3 text-sm font-medium text-texto-suave">
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={claveFila(fila)} className="border-t border-linea">
                {columnas.map((columna) => (
                  <td key={columna.titulo} className={cn("px-4 py-3 align-middle", columna.className)}>
                    {columna.celda(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label={etiqueta}>
        {filas.map((fila) => (
          <li key={claveFila(fila)}>
            <Card>
              <dl className="flex flex-col gap-3">
                {columnas.map((columna) => (
                  <div key={columna.titulo} className="flex flex-col gap-1">
                    <dt className="text-sm font-medium text-texto-suave">{columna.titulo}</dt>
                    <dd className={columna.className}>{columna.celda(fila)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
