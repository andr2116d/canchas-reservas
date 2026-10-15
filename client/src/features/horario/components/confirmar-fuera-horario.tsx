"use client";

import { Button, Modal } from "@/components/ui";
import { fecha } from "@/lib/formato";
import type { ReservaFueraDeHorario } from "../api";

type Props = {
  abierto: boolean;
  reservas: ReservaFueraDeHorario[];
  enviando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
};

export function ConfirmarFueraHorario({ abierto, reservas, enviando, onCerrar, onConfirmar }: Props) {
  const mensaje =
    reservas.length === 1
      ? "1 reserva futura queda fuera del nuevo horario."
      : `${reservas.length} reservas futuras quedan fuera del nuevo horario.`;
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Reservas fuera del horario"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" cargando={enviando} onClick={onConfirmar}>
            Guardar igual
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-texto-suave">
          {mensaje} Si guardas igual no se cancelan: quedan confirmadas y tendrás que atenderlas fuera de la grilla.
        </p>
        <ul
          aria-label="Reservas fuera de horario"
          className="flex max-h-64 flex-col overflow-y-auto rounded-lg border border-linea"
        >
          {reservas.map((reserva) => (
            <li
              key={reserva.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-linea px-3 py-2 text-sm first:border-t-0"
            >
              <span className="font-medium">{reserva.cancha}</span>
              <span className="tabular-nums text-texto-suave">
                {fecha(reserva.fecha)} · {reserva.horaInicio}
              </span>
              <span className="w-full">{reserva.jugador}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}