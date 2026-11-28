"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EstadoEnVivo } from "@/compartido/disponibilidad/estado-en-vivo";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { useAgendaDelDia } from "../hooks/use-agenda-del-dia";
import type { AgendaDelDia as Agenda } from "../servicios/agenda";
import { aDireccion, type FiltrosDeLaAgenda as Filtros, leerFiltros } from "../utilidades/filtros";
import { FiltrosDeLaAgenda } from "./filtros-de-la-agenda";
import { NavegacionDeFecha } from "./navegacion-de-fecha";
import { TurnoDeLaAgenda } from "./turno-de-la-agenda";

function SinTurnos({ ruta, filtros }: { ruta: string; filtros: Filtros }) {
  const filtrada = Boolean(filtros.canchaId || filtros.estado);
  return (
    <div className="rounded-2xl border border-dashed border-linea bg-papel/70 px-5 py-10 text-center text-grava">
      <p>{filtrada ? "No hay turnos con estos filtros." : "No hay turnos reservados este día."}</p>
      {filtrada && (
        <Link href={aDireccion(ruta, { fecha: filtros.fecha })} replace scroll={false} className="mt-2 inline-block font-bold text-botella underline">
          Ver todos los turnos del día
        </Link>
      )}
    </div>
  );
}

function Turnos({ agenda, ruta, filtros }: { agenda: Agenda; ruta: string; filtros: Filtros }) {
  if (agenda.turnos.length === 0) return <SinTurnos ruta={ruta} filtros={filtros} />;
  return (
    <ol aria-label="Turnos del día" className="flex flex-col gap-2">
      {agenda.turnos.map((turno) => <TurnoDeLaAgenda key={turno.codigo} turno={turno} />)}
    </ol>
  );
}

/**
 * Agenda de un día para el personal: turnos por hora con su cliente, estado y saldo.
 * Los filtros van en la dirección y la lista se actualiza sola cuando cambia una reserva.
 */
export function AgendaDelDia({ ruta }: { ruta: string }) {
  const router = useRouter();
  const filtros = leerFiltros(useSearchParams());
  const { agenda, cargando, error, conexion } = useAgendaDelDia(filtros);
  const cambiar = (nuevos: Filtros) => router.replace(aDireccion(ruta, nuevos), { scroll: false });
  if (!agenda) return error ? <p role="alert" className="font-semibold text-error">{error}</p> : <CargaDeContenido texto="Cargando la agenda…" />;

  const elegirFecha = (fecha: string) => cambiar({ ...filtros, fecha: fecha === agenda.hoy ? undefined : fecha });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavegacionDeFecha fecha={agenda.fecha} hoy={agenda.hoy} ultimaFecha={agenda.ultimaFecha} alElegir={elegirFecha} />
        <EstadoEnVivo conexion={conexion} cargando={cargando} />
      </div>
      {error && <p role="alert" className="font-semibold text-error">{error}</p>}
      <FiltrosDeLaAgenda ruta={ruta} filtros={filtros} agenda={agenda} alCambiar={cambiar} />
      <Turnos agenda={agenda} ruta={ruta} filtros={filtros} />
    </div>
  );
}
