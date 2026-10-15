import { fecha } from "@/lib/formato";
import type { ReservaFutura } from "../api";

export function ListaReservasAfectadas({ reservas }: { reservas: ReservaFutura[] }) {
  return (
    <ul aria-label="Reservas afectadas" className="flex max-h-64 flex-col overflow-y-auto rounded-lg border border-linea">
      {reservas.map((reserva) => (
        <li
          key={reserva.id}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-linea px-3 py-2 text-sm first:border-t-0"
        >
          <span className="font-medium tabular-nums">{reserva.codigo}</span>
          <span className="tabular-nums text-texto-suave">
            {fecha(reserva.fecha)} · {reserva.horaInicio}
          </span>
          <span className="w-full">{reserva.cliente}</span>
        </li>
      ))}
    </ul>
  );
}
