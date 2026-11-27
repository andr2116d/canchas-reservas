"use client";

import { TARJETA } from "@/compartido/ui/estilos";
import { enSoles } from "@/compartido/ui/textos-del-local";
import { useCuentaRegresiva } from "../hooks/use-cuenta-regresiva";
import type { MiReserva } from "../servicios/reservas";
import { saldoEnElLocal } from "../utilidades/textos-de-la-reserva";
import { EstadoDeLaSeparacion } from "./estado-de-la-separacion";
import { PlazosDeCancelacion } from "./plazos-de-cancelacion";
import { TurnoPorConfirmar } from "./turno-por-confirmar";

function Montos({ reserva }: { reserva: MiReserva }) {
  const filas = [
    ["Precio final, con IGV", enSoles(reserva.precio)],
    [`Adelanto (${reserva.porcentajeDeAdelanto} %)`, enSoles(reserva.adelanto)],
    ["El resto, en el local", enSoles(saldoEnElLocal(reserva.precio, reserva.adelanto))],
  ];
  return (
    <section aria-labelledby="titulo-montos" className={TARJETA}>
      <h2 id="titulo-montos" className="font-titular text-3xl font-black text-cancha">Lo que pagas</h2>
      <dl className="mt-3 grid gap-2 text-sm">
        {filas.map(([concepto, monto]) => (
          <div key={concepto} className="flex justify-between gap-4"><dt className="text-grava">{concepto}</dt><dd className="font-bold tabular-nums">{monto}</dd></div>
        ))}
      </dl>
      {reserva.adicionales.length > 0 && (
        <p className="mt-4 text-sm text-grava">
          Te tendrán listo: {reserva.adicionales.map((adicional) => adicional.nombre).join(", ")}. Solo se paga si se pierde o se rompe.
        </p>
      )}
    </section>
  );
}

/** La reserva recién separada: su código, cuánto falta para que venza, el turno, los montos y la regla. */
export function ReservaSeparada({ reserva }: { reserva: MiReserva }) {
  const restantes = useCuentaRegresiva(reserva.estado === "PENDIENTE_DE_PAGO" ? reserva.venceEn : null, reserva.ahora);
  return (
    <div className="confirmar-reserva">
      <TurnoPorConfirmar cancha={reserva.cancha} fecha={reserva.fecha} desde={reserva.desde} hasta={reserva.hasta} />
      <Montos reserva={reserva} />
      <PlazosDeCancelacion plazos={reserva.plazos} nota="La regla que regía al separarla. Un cambio posterior no la afecta." />
      <EstadoDeLaSeparacion reserva={reserva} restantes={restantes} />
    </div>
  );
}
