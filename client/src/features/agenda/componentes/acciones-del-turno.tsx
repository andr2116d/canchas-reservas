import Link from "next/link";
import type { TurnoDeLaAgenda } from "../servicios/agenda";
import { procesosDisponibles } from "../utilidades/procesos";

/** Enlaces a los procesos que el estado del turno permite; si ninguno existe, no muestra nada. */
export function AccionesDelTurno({ turno }: { turno: TurnoDeLaAgenda }) {
  const procesos = procesosDisponibles(turno.acciones);
  if (procesos.length === 0) return null;
  return (
    <div className="col-span-2 flex flex-wrap gap-1.5 lg:order-5 lg:col-span-1">
      {procesos.map(({ texto, ruta }) => (
        <Link key={texto} href={ruta(turno.codigo)} className="rounded-xl border border-linea bg-papel px-3 py-1.5 text-sm font-semibold text-botella hover:bg-tiza focus-visible:outline-2 focus-visible:outline-botella">
          {texto}
        </Link>
      ))}
    </div>
  );
}
