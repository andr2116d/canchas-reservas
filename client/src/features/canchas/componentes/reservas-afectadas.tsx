import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import type { ReservaAfectada } from "../servicios/canchas";

const HORA_EN_LIMA = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Por qué no se pudo hacer el cambio y qué reservas lo impiden. */
export function ReservasAfectadas({ mensaje, reservas }: { mensaje: string; reservas: ReservaAfectada[] }) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-xl bg-error-fondo p-3 text-sm">
      <p className="font-bold text-tinta">{mensaje}</p>
      <ul className="list-disc pl-5 tabular-nums">
        {reservas.map((reserva) => (
          <li key={reserva.inicio}>
            {fechaEnLima(reserva.inicio)} – {HORA_EN_LIMA.format(new Date(reserva.fin))} · {reserva.titular}
          </li>
        ))}
      </ul>
      <p className="text-grava">Se podrá hacer cuando estas reservas se jueguen, se cancelen o pasen a otra cancha.</p>
    </div>
  );
}
