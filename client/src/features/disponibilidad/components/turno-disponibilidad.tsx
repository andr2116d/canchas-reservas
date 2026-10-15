"use client";

import { cn } from "@/lib/cn";
import { moneda } from "@/lib/formato";
import { ETIQUETA_ESTADO, ETIQUETA_MOTIVO, type Turno } from "../api";

/**
 * Rayas diagonales para "En mantenimiento".
 * El doc de Diseño dice rayas en `linea`, pero `linea` (#E2E5DF) sobre `fondo` (#F6F7F4)
 * es tan parecido que el recuadro se ve blanco. Se usa `texto-apagado`, que sí se distingue.
 */
export const RAYAS_MANTENIMIENTO =
  "bg-[repeating-linear-gradient(45deg,var(--color-texto-apagado)_0,var(--color-texto-apagado)_3px,transparent_3px,transparent_8px)]";

const FRANJA_NOCHE = "border-l-[3px] border-l-noche-900";

type Props = {
  turno: Turno;
  onElegir?: (turno: Turno) => void;
};

export function estilosTurno(turno: Turno) {
  if (turno.estado === "EN_MANTENIMIENTO") {
    return cn("bg-fondo text-texto-suave", RAYAS_MANTENIMIENTO);
  }
  if (turno.estado === "PENDIENTE") {
    return "bg-alerta-fondo text-alerta";
  }
  if (turno.estado === "OCUPADO") {
    return "bg-linea text-texto-suave";
  }
  return turno.seleccionable ? "bg-cesped-50 text-cesped-700 border border-cesped-600" : "bg-fondo text-texto-apagado";
}

function EtiquetaFranja({ franja }: { franja: Turno["franja"] }) {
  if (franja !== "NOCHE") return null;
  return (
    <span className="rounded-full bg-noche-900 px-1.5 py-0.5 text-[10px] font-medium text-cal-400">Noche</span>
  );
}

function Contenido({ turno }: { turno: Turno }) {
  const motivo = turno.motivo ? ETIQUETA_MOTIVO[turno.motivo] : undefined;
  return (
    <>
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-semibold tabular-nums">{turno.horaInicio}</span>
        <EtiquetaFranja franja={turno.franja} />
      </div>
      {turno.seleccionable && turno.valor !== undefined ? (
        <>
          <span className="text-xs font-medium tabular-nums">{moneda(turno.valor)}</span>
          {turno.adelanto !== undefined && (
            <span className="text-[11px] tabular-nums opacity-80">Adelanto {moneda(turno.adelanto)}</span>
          )}
        </>
      ) : (
        <span className="text-xs">{motivo ?? ETIQUETA_ESTADO[turno.estado]}</span>
      )}
    </>
  );
}

/** Celda de la grilla de escritorio. */
export function CeldaTurno({ turno, onElegir }: Props) {
  const clases = cn(
    "flex min-h-11 w-full flex-col justify-center gap-0.5 rounded-lg px-2 py-1.5 text-left text-xs",
    turno.franja === "NOCHE" && FRANJA_NOCHE,
    estilosTurno(turno),
  );
  const motivo = turno.motivo ? ETIQUETA_MOTIVO[turno.motivo] : undefined;

  if (!turno.seleccionable) {
    return (
      <div className={clases} title={motivo}>
        <Contenido turno={turno} />
      </div>
    );
  }
  return (
    <button type="button" className={cn(clases, "hover:bg-cesped-600 hover:text-white")} onClick={() => onElegir?.(turno)}>
      <Contenido turno={turno} />
    </button>
  );
}

/** Tarjeta de la lista de celular. */
export function TarjetaTurno({ turno, onElegir }: Props) {
  const motivo = turno.motivo ? ETIQUETA_MOTIVO[turno.motivo] : undefined;
  const clases = cn(
    "flex min-h-11 w-full flex-col gap-1 rounded-xl border p-3 text-left",
    turno.franja === "NOCHE" && FRANJA_NOCHE,
    estilosTurno(turno),
  );

  if (!turno.seleccionable) {
    return (
      <div className={clases} title={motivo}>
        <Contenido turno={turno} />
      </div>
    );
  }
  return (
    <button type="button" className={cn(clases, "hover:bg-cesped-600 hover:text-white")} onClick={() => onElegir?.(turno)}>
      <Contenido turno={turno} />
    </button>
  );
}
