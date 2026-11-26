import type { Choque } from "../hooks/use-formulario-de-bloqueo";
import type { ReservaCruzada } from "../servicios/bloqueos";
import { describirRango } from "../utilidades/rango-en-lima";

function ListaDeRangos({ filas }: { filas: string[] }) {
  return (
    <ul className="list-disc pl-5 tabular-nums">
      {filas.map((fila) => <li key={fila}>{fila}</li>)}
    </ul>
  );
}

const reserva = (r: ReservaCruzada) => `${r.cancha} · ${describirRango(r.inicio, r.fin)} · ${r.titular}`;

/** Por qué no se guardó: reservas que hay que resolver antes u otro bloqueo en el mismo rango. */
export function ChoqueDelBloqueo({ choque }: { choque: Choque }) {
  const filas = choque.tipo === "choca-con-reservas"
    ? choque.reservas.map(reserva)
    : choque.bloqueos.map((b) => `${b.cancha} · ${describirRango(b.inicio, b.fin)}`);
  return (
    <div role="alert" className="confirmacion-de-cancha flex flex-col gap-2 rounded-xl bg-error-fondo p-3 text-sm">
      <p className="font-bold text-tinta">{choque.mensaje}</p>
      <ListaDeRangos filas={filas} />
      {choque.tipo === "choca-con-bloqueos" && <p className="text-grava">Cambia las horas o quita ese bloqueo primero.</p>}
    </div>
  );
}

/** Tras una emergencia: reservas afectadas que cada jugador debe resolver (marco legal 9.3). */
export function ReservasAfectadasPorBloqueo({ reservas }: { reservas: ReservaCruzada[] }) {
  if (reservas.length === 0) return null;
  const cuantas = reservas.length === 1 ? "1 reserva quedó afectada" : `${reservas.length} reservas quedaron afectadas`;
  return (
    <div role="alert" className="confirmacion-de-cancha flex flex-col gap-2 rounded-xl bg-[#fbf1d9] p-3 text-sm text-[#6d4600]">
      <p><b>{cuantas}.</b> Cada jugador podrá elegir devolución del 100 %, reprogramación sin costo o crédito.</p>
      <ListaDeRangos filas={reservas.map(reserva)} />
    </div>
  );
}
