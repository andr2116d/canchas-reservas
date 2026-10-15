"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fecha } from "@/lib/formato";
import { useTurnosEnVivo } from "@/lib/use-turnos-en-vivo";
import type { Cancha, Turno } from "../api";
import { dentroDeRango, limiteInferior, limiteSuperior } from "../fechas";
import { useDisponibilidad } from "../hooks";
import { GrillaDisponibilidad } from "./grilla-disponibilidad";
import { LeyendaEstados } from "./leyenda-estados";
import { ListaTurnos } from "./lista-turnos";
import { SelectorCancha } from "./selector-cancha";
import { SelectorFecha } from "./selector-fecha";

type Rol = "JUGADOR" | "RECEPCIONISTA";

type Props = {
  rol: Rol;
  fechaInicial?: string;
};

function Esqueleto() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((fila) => (
        <div key={fila} className="flex gap-2">
          <div className="h-11 flex-1 animate-pulse rounded-lg bg-linea" />
          <div className="h-11 flex-1 animate-pulse rounded-lg bg-linea" />
        </div>
      ))}
    </div>
  );
}

export function PantallaDisponibilidad({ rol, fechaInicial }: Props) {
  const router = useRouter();
  const min = limiteInferior();
  const max = limiteSuperior();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaInicial ?? min);
  const [canchaId, setCanchaId] = useState<number | undefined>(undefined);

  useTurnosEnVivo(fechaSeleccionada);

  const consulta = useDisponibilidad(fechaSeleccionada);
  const todas: Cancha[] = consulta.data?.canchas ?? [];
  const canchas = canchaId === undefined ? todas : todas.filter((c) => c.id === canchaId);

  const elegir = (cancha: Cancha, turno: Turno) => {
    if (rol !== "JUGADOR") return;
    const parametros = new URLSearchParams({
      canchaId: String(cancha.id),
      fecha: fechaSeleccionada,
      horaInicio: turno.horaInicio,
    });
    router.push(`/jugador/reservas/confirmar?${parametros}`);
  };

  const cambiarFecha = (nueva: string) => {
    if (!dentroDeRango(nueva)) return;
    setFechaSeleccionada(nueva);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Disponibilidad</h1>
        <p className="text-sm text-texto-suave">Elige el día y la cancha para ver los turnos libres.</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <SelectorFecha fecha={fechaSeleccionada} min={min} max={max} onCambiar={cambiarFecha} />
        <SelectorCancha canchas={todas} canchaId={canchaId} onCambiar={setCanchaId} />
      </div>

      <LeyendaEstados />

      {consulta.isPending ? (
        <Esqueleto />
      ) : consulta.isError ? (
        <EmptyState
          mensaje={consulta.error.message || "No se pudo cargar la disponibilidad"}
          accion={
            <Button variante="secundario" onClick={() => consulta.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : consulta.data?.abierto === false ? (
        <EmptyState mensaje={`No hay horario de reservas el ${fecha(fechaSeleccionada)}`} />
      ) : canchas.length === 0 ? (
        <EmptyState mensaje="Aún no hay canchas registradas" />
      ) : (
        <>
          <GrillaDisponibilidad canchas={canchas} onElegir={elegir} />
          <ListaTurnos canchas={canchas} onElegir={elegir} />
        </>
      )}
    </div>
  );
}
