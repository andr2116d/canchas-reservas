"use client";

import { DIAS_DE_LA_SEMANA, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import { TARJETA } from "@/compartido/ui/estilos";
import { useTurnosDelDia } from "../hooks/use-turnos-del-dia";
import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TurnoConPrecio, type TurnosConsultados } from "../servicios/tarifas";
import { SelectorSegmentado } from "./selector-segmentado";

const TIPOS = TIPOS_DE_CANCHA.map((valor) => ({ valor, texto: NOMBRE_DEL_TIPO[valor] }));
const DIAS = DIAS_DE_LA_SEMANA.map((valor) => ({ valor, texto: NOMBRE_DEL_DIA[valor].slice(0, 3) }));

const SIN_TURNOS: Record<"SIN_HORARIO" | "CERRADO", string> = {
  SIN_HORARIO: "Todavía no hay horario de atención guardado.",
  CERRADO: "Ese día el local no abre.",
};

function FilaDelTurno({ turno }: { turno: TurnoConPrecio }) {
  const desglose = turno.tramos.map((tramo) => `${tramo.franja === "DIA" ? "día" : "noche"} S/ ${tramo.monto}`).join(" + ");
  return (
    <li className="flex items-baseline justify-between gap-4 border-t border-linea py-2 first:border-t-0">
      <span className="flex flex-col">
        <span className="font-semibold text-tinta tabular-nums">
          {turno.desde} a {turno.hasta}
          {turno.corto && <span className="ml-2 rounded-full bg-capitan px-2 py-0.5 text-xs text-tinta">Turno corto</span>}
        </span>
        {turno.tramos.length > 1 && <span className="text-sm text-grava">{desglose.charAt(0).toUpperCase() + desglose.slice(1)}</span>}
      </span>
      <span className="font-titular text-2xl font-black text-botella tabular-nums">S/ {turno.total}</span>
    </li>
  );
}

function ListaDeTurnos({ turnos }: { turnos: TurnosConsultados }) {
  if (turnos.estado !== "ABIERTO") return <p className="text-grava">{SIN_TURNOS[turnos.estado]}</p>;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-grava">La noche empieza a las {turnos.inicioDeLaNoche}.</p>
      <ul>{turnos.turnos.map((turno) => <FilaDelTurno key={turno.desde} turno={turno} />)}</ul>
      {turnos.sinTurno && <p className="text-sm text-alerta">De {turnos.sinTurno.desde} a {turnos.sinTurno.hasta} no se ofrece turno.</p>}
    </div>
  );
}

/** Turnos que se ofrecen en un día de la semana para un tipo de cancha, con lo que cuesta cada uno. */
export function TurnosDelDia() {
  const { tipo, setTipo, dia, setDia, resultado } = useTurnosDelDia();
  return (
    <section aria-labelledby="turnos-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="turnos-titulo" className="font-titular text-3xl font-black text-tinta">Turnos del día</h2>
        <p className="text-sm text-grava">Lo que vería un jugador: los turnos que salen del horario guardado y su precio.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr]">
        <SelectorSegmentado leyenda="Tipo de cancha" nombre="tipo-de-turnos" opciones={TIPOS} valor={tipo} elegir={setTipo} />
        <SelectorSegmentado leyenda="Día" nombre="dia-de-turnos" opciones={DIAS} valor={dia} elegir={setDia} />
      </div>
      <div aria-live="polite">
        {resultado?.tipo === "error" && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{resultado.mensaje}</p>}
        {resultado?.tipo === "consultado" && <ListaDeTurnos turnos={resultado.turnos} />}
      </div>
    </section>
  );
}
