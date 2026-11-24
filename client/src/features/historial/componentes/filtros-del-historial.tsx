"use client";

import { type ReactNode, useState } from "react";
import { TARJETA } from "@/compartido/ui/estilos";
import { ACCIONES, ACCIONES_POR_CATEGORIA, type Autor, CATEGORIAS, type Categoria } from "../servicios/historial";
import { FILTROS_INICIALES, type Filtros, hayFiltros } from "../utilidades/filtros";
import { useConsultarHistorial } from "./consulta-del-historial";

interface FiltrosDelHistorialProps {
  filtros: Filtros;
  autores: Autor[];
  /** Lo que no se pudo aplicar de la dirección, como un rango de fechas invertido. */
  aviso?: string;
}

type Aplicar = (cambios: Partial<Filtros>) => void;

const ROL: Record<Autor["rol"], string> = { ADMINISTRADOR: "administración", RECEPCIONISTA: "recepción" };

function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-bold tracking-wide text-grava uppercase">{etiqueta}</label>
      {children}
    </div>
  );
}

/** Al cambiar de categoría, una acción que no le corresponde se quita. */
function alElegirCategoria(categoria: Categoria | "", filtros: Filtros): Partial<Filtros> {
  const valeLaAccion = !categoria || !filtros.accion || ACCIONES_POR_CATEGORIA[categoria].includes(filtros.accion);
  return { categoria, accion: valeLaAccion ? filtros.accion : "" };
}

/** Persona, categoría y acción; la acción ofrece solo las de la categoría elegida. */
function Selectores({ filtros, autores, aplicar }: { filtros: Filtros; autores: Autor[]; aplicar: Aplicar }) {
  const acciones = filtros.categoria ? ACCIONES.filter((a) => ACCIONES_POR_CATEGORIA[filtros.categoria as Categoria].includes(a.valor)) : ACCIONES;
  return (
    <>
      <Campo id="filtro-persona" etiqueta="Persona">
        <select id="filtro-persona" value={filtros.autor} onChange={(e) => aplicar({ autor: e.target.value })} className="campo-del-historial">
          <option value="">Todas</option>
          {autores.map((autor) => <option key={autor.id} value={autor.id}>{`${autor.nombre} · ${ROL[autor.rol]}`}</option>)}
        </select>
      </Campo>
      <Campo id="filtro-categoria" etiqueta="Categoría">
        <select id="filtro-categoria" value={filtros.categoria} onChange={(e) => aplicar(alElegirCategoria(e.target.value as Categoria | "", filtros))} className="campo-del-historial">
          <option value="">Todas</option>
          {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.texto}</option>)}
        </select>
      </Campo>
      <Campo id="filtro-accion" etiqueta="Acción">
        <select id="filtro-accion" value={filtros.accion} onChange={(e) => aplicar({ accion: e.target.value as Filtros["accion"] })} className="campo-del-historial">
          <option value="">Todas</option>
          {acciones.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
        </select>
      </Campo>
    </>
  );
}

/** Solo importantes, el orden y, si algo filtra, limpiar. */
function Opciones({ filtros, aplicar, limpiar }: { filtros: Filtros; aplicar: Aplicar; limpiar?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button type="button" aria-pressed={filtros.soloImportantes} onClick={() => aplicar({ soloImportantes: !filtros.soloImportantes })} className="interruptor-del-historial">
        <span aria-hidden="true" className="punto-importante" />
        Solo importantes
      </button>
      <div role="group" aria-label="Orden" className="segmento-del-historial">
        <button type="button" aria-pressed={filtros.orden === "RECIENTES"} onClick={() => aplicar({ orden: "RECIENTES" })}>Más recientes</button>
        <button type="button" aria-pressed={filtros.orden === "ANTIGUOS"} onClick={() => aplicar({ orden: "ANTIGUOS" })}>Más antiguos</button>
      </div>
      {limpiar && (
        <button type="button" onClick={limpiar} className="ml-auto text-sm font-bold text-botella underline-offset-4 hover:underline">Limpiar filtros</button>
      )}
    </div>
  );
}

/** Filtros combinables en una barra compacta; cada cambio consulta de nuevo desde la primera página. */
export function FiltrosDelHistorial({ filtros, autores, aviso }: FiltrosDelHistorialProps) {
  const consultar = useConsultarHistorial();
  const [fechas, setFechas] = useState({ desde: filtros.desde, hasta: filtros.hasta });
  const rangoInvertido = Boolean(fechas.desde && fechas.hasta && fechas.hasta < fechas.desde);
  const aplicar: Aplicar = (cambios) => consultar({ ...filtros, ...cambios, pagina: 1 });
  const cambiarFecha = (cambio: Partial<typeof fechas>) => {
    const nuevas = { ...fechas, ...cambio };
    setFechas(nuevas);
    if (!(nuevas.desde && nuevas.hasta && nuevas.hasta < nuevas.desde)) aplicar(nuevas);
  };
  const limpiar = () => {
    setFechas({ desde: "", hasta: "" });
    consultar(FILTROS_INICIALES);
  };
  const mensaje = rangoInvertido ? "La fecha final es anterior a la inicial: elige otra para filtrar por fechas." : aviso;

  return (
    <section aria-label="Filtros" className={`${TARJETA} flex flex-col gap-3 !p-4 sm:!p-5`}>
      <div className="filtros-del-historial grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_9.5rem_9.5rem]">
        <Selectores filtros={filtros} autores={autores} aplicar={aplicar} />
        <Campo id="filtro-desde" etiqueta="Desde">
          <input id="filtro-desde" type="date" value={fechas.desde} onChange={(e) => cambiarFecha({ desde: e.target.value })} className="campo-del-historial" />
        </Campo>
        <Campo id="filtro-hasta" etiqueta="Hasta">
          <input id="filtro-hasta" type="date" value={fechas.hasta} aria-invalid={rangoInvertido || undefined} onChange={(e) => cambiarFecha({ hasta: e.target.value })} className="campo-del-historial" />
        </Campo>
      </div>
      <Opciones filtros={filtros} aplicar={aplicar} limpiar={hayFiltros(filtros) || aviso ? limpiar : undefined} />
      {mensaje && <p role="alert" className="rounded-lg bg-[#fbf1d9] px-3 py-2 text-sm font-semibold text-tinta">{mensaje}</p>}
    </section>
  );
}
