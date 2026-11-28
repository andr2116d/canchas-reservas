"use client";

import Link from "next/link";
import { ESTADOS_DE_RESERVA, type AgendaDelDia, NOMBRE_DEL_ESTADO } from "../servicios/agenda";
import { aDireccion, type FiltrosDeLaAgenda } from "../utilidades/filtros";

interface FiltrosProps {
  ruta: string;
  filtros: FiltrosDeLaAgenda;
  agenda: AgendaDelDia;
  alCambiar: (filtros: FiltrosDeLaAgenda) => void;
}

const CHIP = "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold";

/** Los estados con cuántos turnos hay en cada uno, y la cancha, en una sola fila. */
export function FiltrosDeLaAgenda({ ruta, filtros, agenda, alCambiar }: FiltrosProps) {
  const total = Object.values(agenda.conteos).reduce((suma, cantidad) => suma + cantidad, 0);
  const opciones = [{ estado: undefined, texto: "Todos", cantidad: total }, ...ESTADOS_DE_RESERVA.map((estado) => ({ estado, texto: NOMBRE_DEL_ESTADO[estado], cantidad: agenda.conteos[estado] }))];

  return (
    <div className="vidrio-claro flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
      <nav aria-label="Estado" className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0">
        {opciones.map(({ estado, texto, cantidad }) => {
          const actual = filtros.estado === estado;
          return (
            <Link
              key={texto}
              href={aDireccion(ruta, { ...filtros, estado })}
              replace
              scroll={false}
              aria-current={actual ? "page" : undefined}
              className={`${CHIP} ${actual ? "border-cancha bg-cancha text-papel" : "border-linea bg-papel text-tinta"}`}
            >
              {texto}{" "}
              <b className={`tabular-nums ${actual ? "text-capitan" : "text-grava"}`}>{cantidad}</b>
            </Link>
          );
        })}
      </nav>
      <select
        aria-label="Cancha"
        value={filtros.canchaId ?? ""}
        onChange={(evento) => alCambiar({ ...filtros, canchaId: evento.target.value || undefined })}
        className="w-fit rounded-xl border border-linea bg-papel px-3 py-2 text-sm font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-botella sm:ml-auto"
      >
        <option value="">Todas las canchas</option>
        {agenda.canchas.map((cancha) => (
          <option key={cancha.id} value={String(cancha.id)}>{cancha.nombre}</option>
        ))}
      </select>
    </div>
  );
}
