"use client";

import { useState } from "react";
import { Button, Card, Input, Select } from "@/components/ui";

type TipoCompensacion = "CREDITO" | "DEVOLUCION";

const DESTINO_ADELANTO: Record<TipoCompensacion, string> = {
  DEVOLUCION: "en recepción",
  CREDITO: "como crédito",
};

function fraseDelJugador(horas: string, compensacion: TipoCompensacion) {
  const valor = horas.trim() === "" ? null : Number(horas);
  const cuando =
    valor === null || Number.isNaN(valor)
      ? "con la anticipación indicada"
      : valor === 0
        ? "hasta el inicio del turno"
        : `hasta ${valor} h antes del inicio del turno`;
  return `Puedes cancelar ${cuando} y se te devolverá tu adelanto ${DESTINO_ADELANTO[compensacion]}. Si cancelas después, el adelanto queda retenido.`;
}

export function PantallaReglaCancelacion() {
  const [horas, setHoras] = useState("24");
  const [compensacion, setCompensacion] = useState<TipoCompensacion>("CREDITO");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">
        Regla de cancelación
      </h1>

      <Card className="flex flex-col gap-4">
        <div className="max-w-48">
          <Input
            etiqueta="Horas de anticipación"
            type="number"
            min={0}
            step={1}
            ayuda="Número entero de horas, mínimo 0."
            value={horas}
            onChange={(evento) => setHoras(evento.target.value)}
          />
        </div>

        <div className="max-w-48">
          <Select
            etiqueta="Compensación del adelanto"
            value={compensacion}
            onChange={(evento) => setCompensacion(evento.target.value as TipoCompensacion)}
          >
            <option value="CREDITO">Crédito</option>
            <option value="DEVOLUCION">Devolución</option>
          </Select>
        </div>

        <div>
          <Button>Guardar</Button>
        </div>
      </Card>

      <div className="rounded-lg border border-linea bg-fondo px-3 py-2 text-sm">
        <p className="font-medium">Así lo verá el jugador</p>
        <p className="text-texto-suave">{fraseDelJugador(horas, compensacion)}</p>
      </div>
    </div>
  );
}
