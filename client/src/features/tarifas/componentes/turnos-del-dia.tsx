"use client";

import { useState } from "react";
import { useBorrador } from "@/compartido/horario/borrador";
import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import { calcularTurnos, type TurnoCalculado } from "@/compartido/horario/turnos";
import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TipoDeCancha } from "../servicios/tarifas";
import { SelectorSegmentado } from "./selector-segmentado";

const TIPOS = TIPOS_DE_CANCHA.map((valor) => ({ valor, texto: NOMBRE_DEL_TIPO[valor] }));
// Dos letras para que la semana entre en una fila; el nombre completo queda para los lectores de pantalla.
const DIAS = DIAS_DE_LA_SEMANA.map((valor) => ({ valor, texto: NOMBRE_DEL_DIA[valor].slice(0, 2), nombreAccesible: NOMBRE_DEL_DIA[valor] }));

function FilaDelTurno({ turno }: { turno: TurnoCalculado }) {
  const detalle = turno.corto ? "Turno corto" : turno.partes && `Día S/ ${turno.partes.dia} + noche S/ ${turno.partes.noche}`;
  return (
    <li className="flex items-baseline justify-between gap-3 border-t border-linea/80 py-2 first:border-t-0">
      <span className="flex flex-col">
        <span className="text-sm font-bold text-tinta tabular-nums">{turno.desde} a {turno.hasta}</span>
        {detalle && <span className="text-xs text-grava">{detalle}</span>}
      </span>
      <span className="font-titular text-xl font-black whitespace-nowrap text-botella tabular-nums">S/ {turno.total}</span>
    </li>
  );
}

/** Lista de turnos del día elegido, o por qué no hay. */
function ListaDeTurnos({ tipo, dia }: { tipo: TipoDeCancha; dia: DiaDeLaSemana }) {
  const { semana, tarifas } = useBorrador();
  const horario = semana?.[dia];
  const tarifa = tarifas[tipo];
  const aviso = (texto: string) => <p className="text-sm text-grava">{texto}</p>;
  if (!semana) return aviso("Todavía no hay horario de atención.");
  if (!horario) return aviso(`El ${NOMBRE_DEL_DIA[dia].toLowerCase()} el local no abre.`);
  if (!tarifa) return aviso(`${NOMBRE_DEL_TIPO[tipo]} todavía no tiene tarifa.`);
  const { turnos, sinTurno } = calcularTurnos(horario, tarifa);
  return (
    <>
      <p className="text-sm text-grava">{turnos.length} {turnos.length === 1 ? "turno" : "turnos"} · precio de noche desde las {horario.inicioDeLaNoche}</p>
      <ul className="min-h-0 overflow-y-auto pr-1">{turnos.map((turno) => <FilaDelTurno key={turno.desde} turno={turno} />)}</ul>
      {sinTurno && (
        <p className="rounded-xl bg-alerta/10 px-3 py-2 text-xs font-medium text-alerta">
          De {sinTurno.desde} a {sinTurno.hasta} no se ofrece turno: no alcanza para uno completo.
        </p>
      )}
    </>
  );
}

/** Vista previa de los turnos de un día, con lo que se está editando aunque no se haya guardado. */
export function TurnosDelDia() {
  const [tipo, setTipo] = useState<TipoDeCancha>("FUTBOL_5");
  const [dia, setDia] = useState<DiaDeLaSemana>("LUNES");
  return (
    <section aria-labelledby="turnos-titulo" className="vidrio-claro flex max-h-[calc(100dvh-7.5rem)] flex-col gap-3 rounded-3xl p-5">
      <header className="flex flex-col gap-1">
        <h2 id="turnos-titulo" className="font-titular text-2xl font-black text-tinta">Turnos del día</h2>
        <p className="text-sm text-grava">Así los verá el jugador, con los cambios que todavía no guardas.</p>
      </header>
      <SelectorSegmentado nombre="Tipo de cancha" opciones={TIPOS} valor={tipo} elegir={setTipo} />
      <SelectorSegmentado nombre="Día" opciones={DIAS} valor={dia} elegir={setDia} />
      <ListaDeTurnos tipo={tipo} dia={dia} />
    </section>
  );
}
