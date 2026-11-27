"use client";

import Link from "next/link";
import type { TurnoElegido } from "@/compartido/sesion/turno-elegido";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { useResumenDeReserva } from "../hooks/use-resumen-de-reserva";
import { useSepararTurno } from "../hooks/use-separar-turno";
import type { ResumenDeReserva } from "../servicios/reservas";
import { MaterialDelLocal } from "./material-del-local";
import { PlazosDeCancelacion } from "./plazos-de-cancelacion";
import { TotalDeLaReserva } from "./total-de-la-reserva";
import { TurnoPorConfirmar } from "./turno-por-confirmar";

/** Cuando el turno ya no se puede separar: por qué y cómo elegir otro. */
export function TurnoNoDisponible({ mensaje }: { mensaje: string }) {
  return (
    <section role="alert" className={`${TARJETA} flex max-w-xl flex-col items-start gap-4`}>
      <h2 className="font-titular text-3xl font-black text-cancha">Este turno no se puede separar</h2>
      <p>{mensaje}</p>
      <Link href="/inicio/reservar" className={BOTON_PRINCIPAL}>Elegir otro turno</Link>
    </section>
  );
}

function Resumen({ turno, resumen, recargar }: { turno: TurnoElegido; resumen: ResumenDeReserva; recargar: () => Promise<unknown> }) {
  const { pedidos, alternar, separar, enviando, aviso } = useSepararTurno(turno, resumen, recargar);
  return (
    <div className="confirmar-reserva">
      <TurnoPorConfirmar cancha={resumen.cancha} fecha={resumen.fecha} desde={resumen.desde} hasta={resumen.hasta} cambiar />
      <PlazosDeCancelacion plazos={resumen.plazos} nota="La regla queda guardada con tu reserva: un cambio posterior no la afecta." />
      <MaterialDelLocal adicionales={resumen.adicionales} pedidos={pedidos} alternar={alternar} />
      <TotalDeLaReserva resumen={resumen} enviando={enviando} aviso={aviso} separar={() => void separar()} />
    </div>
  );
}

/** Revisión del turno elegido antes de separarlo: precio, regla de cancelación y material del local. */
export function ConfirmarReserva({ turno }: { turno: TurnoElegido }) {
  const { estado, recargar } = useResumenDeReserva(turno);
  if (estado.tipo === "cargando") return <CargaDeContenido texto="Cargando tu turno…" />;
  if (estado.tipo !== "listo") return <TurnoNoDisponible mensaje={estado.mensaje} />;
  return <Resumen turno={turno} resumen={estado.resumen} recargar={recargar} />;
}
