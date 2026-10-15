"use client";

import { useState } from "react";
import { Badge, Card, EmptyState, Input, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { hoyEnLima } from "@/lib/formato";
import { useVistaPrevia } from "../hooks";

export function VistaPreviaTurnos() {
  const [fecha, setFecha] = useState(hoyEnLima());
  const { data: turnos, isPending, isError, error } = useVistaPrevia(fecha);

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Turnos del día</h2>
      <Input etiqueta="Día" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      {isPending ? (
        <div className="flex justify-center py-6 text-texto-suave">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <p role="alert" className="rounded-lg bg-error-fondo px-3 py-2 text-sm text-error">
          {error.message}
        </p>
      ) : turnos?.length === 0 ? (
        <EmptyState mensaje="Ese día no genera turnos" />
      ) : (
        <ul aria-label="Turnos del día" className="flex flex-col">
          {turnos?.map((turno) => {
            const noche = turno.franja === "NOCHE";
            return (
              <li
                key={turno.horaInicio}
                className={cn(
                  "flex items-center justify-between gap-3 border-t border-linea px-1 py-3 first:border-t-0",
                  noche && "border-l-[3px] border-noche-900 bg-noche-100 pl-3",
                )}
              >
                <span className="font-medium tabular-nums">
                  {turno.horaInicio} – {turno.horaFin}
                </span>
                {noche ? (
                  <Badge className="bg-noche-900 text-cal-400">Noche</Badge>
                ) : (
                  <Badge>Día</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}