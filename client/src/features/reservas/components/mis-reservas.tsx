"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { fecha } from "@/lib/formato";
import { useMisReservas } from "../hooks";
import type { EstadoReserva, ReservaJugador } from "../api";

const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PENDIENTE_VALIDACION: "Pendiente de validación",
  CONFIRMADA: "Confirmada",
  EN_JUEGO: "En juego",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
  AUSENTE: "Ausente",
};

function tonoEstado(estado: EstadoReserva) {
  switch (estado) {
    case "PENDIENTE_PAGO":
    case "PENDIENTE_VALIDACION":
      return "alerta";
    case "CONFIRMADA":
      return "info";
    case "EN_JUEGO":
      return "juego";
    case "FINALIZADA":
    case "EXPIRADA":
      return "neutro";
    case "CANCELADA":
    case "AUSENTE":
      return "error";
    default:
      return "neutro";
  }
}

export function PantallaReservas() {
  const { data, isLoading, isError, error } = useMisReservas();

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">
          Mis reservas
        </h1>
        <p className="text-sm text-texto-suave">
          Tus reservas, las más próximas primero
        </p>
      </header>

      {isLoading && <p className="text-texto-suave">Cargando tus reservas…</p>}

      {isError && (
        <p className="text-error">
          {(error as Error)?.message ?? "No se pudieron cargar tus reservas"}
        </p>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState mensaje="No tienes reservas todavía" />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.map((reserva: ReservaJugador) => (
            <li key={reserva.id}>
              <Card className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-bold tabular-nums">
                      {reserva.codigo}
                    </p>
                    <p className="text-sm text-texto-suave">
                      {fecha(reserva.fecha)} · {reserva.horaInicio}
                      {reserva.horaFin ? `–${reserva.horaFin}` : ""}
                    </p>
                    {reserva.cancha && (
                      <p className="text-sm text-texto-suave">{reserva.cancha.nombre}</p>
                    )}
                  </div>
                  <Badge tono={tonoEstado(reserva.estado)}>
                    {ETIQUETA_ESTADO[reserva.estado]}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export const PantallaMisReservas = PantallaReservas;
export const MisReservas = PantallaReservas;
export const ListadoReservas = PantallaReservas;
export default PantallaReservas;