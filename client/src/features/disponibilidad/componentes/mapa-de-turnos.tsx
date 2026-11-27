"use client";

import { useState } from "react";
import { NOMBRE_DEL_TIPO, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { ListaDePestanas } from "@/compartido/ui/lista-de-pestanas";
import { useMapaDelDia } from "../hooks/use-mapa-del-dia";
import { useTurnoElegido } from "../hooks/use-turno-elegido";
import type { MapaDelDia, TipoDelMapa } from "../servicios/disponibilidad";
import { EstadoEnVivo } from "@/compartido/disponibilidad/estado-en-vivo";
import { LeyendaDeEstados } from "./leyenda-de-estados";
import { SelectorDeFecha } from "./selector-de-fecha";
import { TablaDeTurnos } from "./tabla-de-turnos";
import { type ContextoDelMapa, TuTurno } from "./tu-turno";

const SIN_TURNOS: Record<"CERRADO" | "SIN_HORARIO", string> = {
  CERRADO: "El local no abre este día. Elige otra fecha.",
  SIN_HORARIO: "Todavía no hay horario de atención: aún no hay turnos para reservar.",
};

const libres = (tipo: TipoDelMapa) =>
  tipo.estado === "CON_TURNOS" ? tipo.turnos.flatMap((t) => t.canchas).filter((c) => c.estado === "DISPONIBLE").length : 0;

function Aviso({ texto }: { texto: string }) {
  return <p className="rounded-2xl border border-linea bg-papel p-5 text-grava">{texto}</p>;
}

function PestanasDeTipos({ mapa, activa, alElegir }: { mapa: MapaDelDia; activa: TipoDeCancha; alElegir: (tipo: TipoDeCancha) => void }) {
  if (mapa.tipos.length < 2) return null;
  const pestanas = mapa.tipos.map((tipo) => ({ valor: tipo.tipo, texto: `${NOMBRE_DEL_TIPO[tipo.tipo]} · ${libres(tipo)} libres` }));
  return <ListaDePestanas etiqueta="Tipo de cancha" pestanas={pestanas} activa={activa} alElegir={alElegir} />;
}

/**
 * Mapa de turnos de un día: fecha, tipo de cancha, cada turno con su precio, su
 * adelanto y su estado en cada cancha. Se actualiza solo; lo usan el público, el jugador y recepción.
 */
export function MapaDeTurnos({ contexto }: { contexto: ContextoDelMapa }) {
  const { mapa, cargando, error, conexion, elegirFecha } = useMapaDelDia();
  const [tipoElegido, setTipoElegido] = useState<TipoDeCancha>();
  const turno = useTurnoElegido(mapa);
  if (!mapa) return error ? <p role="alert" className="font-semibold text-error">{error}</p> : <CargaDeContenido texto="Cargando turnos…" />;

  const tipo = mapa.tipos.find((t) => t.tipo === tipoElegido) ?? mapa.tipos[0];
  const cambiarFecha = (fecha: string) => {
    turno.quitar();
    elegirFecha(fecha);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SelectorDeFecha fecha={mapa.fecha} hoy={mapa.hoy} ultimaFecha={mapa.ultimaFecha} alElegir={cambiarFecha} />
        <EstadoEnVivo conexion={conexion} cargando={cargando} />
      </div>
      {error && <p role="alert" className="font-semibold text-error">{error}</p>}
      {tipo && <PestanasDeTipos mapa={mapa} activa={tipo.tipo} alElegir={setTipoElegido} />}
      <LeyendaDeEstados />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,max-content)_19rem]">
        <div id={tipo ? `panel-${tipo.tipo}` : undefined} role={mapa.tipos.length > 1 ? "tabpanel" : undefined} aria-labelledby={tipo && mapa.tipos.length > 1 ? `pestana-${tipo.tipo}` : undefined} className="min-w-0">
          {mapa.local !== "ABIERTO" && <Aviso texto={SIN_TURNOS[mapa.local]} />}
          {mapa.local === "ABIERTO" && !tipo && <Aviso texto="Todavía no hay canchas para reservar." />}
          {tipo?.estado === "SIN_TARIFA" && <Aviso texto={`${NOMBRE_DEL_TIPO[tipo.tipo]} todavía no tiene precio: sus turnos aún no se pueden reservar.`} />}
          {tipo?.estado === "CON_TURNOS" && (
            <TablaDeTurnos
              canchas={tipo.canchas}
              turnos={tipo.turnos}
              inicioDeLaNoche={tipo.inicioDeLaNoche}
              duracionDelTurnoHoras={tipo.duracionDelTurnoHoras}
              ahora={mapa.ahora}
              elegido={turno.elegido && { desde: turno.elegido.turno.desde, canchaId: turno.elegido.cancha.id }}
              alElegir={(t, cancha) => turno.elegir(tipo.tipo, t, cancha)}
            />
          )}
        </div>
        <TuTurno contexto={contexto} fecha={mapa.fecha} porcentaje={mapa.adelanto} elegido={turno.elegido} aviso={turno.aviso} alCerrar={turno.quitar} />
      </div>
    </div>
  );
}
