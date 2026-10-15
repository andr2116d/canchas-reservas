import { EmptyState } from "@/components/ui";
import { moneda, type Franja } from "./tarjeta-franja";

export interface FilaHistorial {
  id: number;
  franja: Franja;
  valor: number;
  desde: string;
  hasta: string | null;
}

interface TablaHistorialProps {
  filas: FilaHistorial[];
}

const TITULOS: Record<Franja, string> = { DIA: "Día", NOCHE: "Noche" };

export function TablaHistorial({ filas }: TablaHistorialProps) {
  if (filas.length === 0) return <EmptyState mensaje="Aún no hay cambios de tarifa" />;

  return (
    <div className="overflow-x-auto rounded-xl border border-noche-900/15">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-noche-900/15">
            <th scope="col" className="px-4 py-3 font-medium text-texto-suave">
              Franja
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-texto-suave">
              Valor
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-texto-suave">
              Desde
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-texto-suave">
              Hasta
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-b border-noche-900/10 last:border-b-0">
              <td className="px-4 py-3 text-noche-900">{TITULOS[fila.franja]}</td>
              <td className="px-4 py-3 text-noche-900">{moneda(fila.valor)}</td>
              <td className="px-4 py-3 text-noche-900">{fila.desde}</td>
              <td className="px-4 py-3 text-noche-900">{fila.hasta ?? "Vigente"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}