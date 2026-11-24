"use client";

import type { ReactNode } from "react";
import { ACCIONES, ACCIONES_POR_CATEGORIA, type Autor, CATEGORIAS, type Categoria } from "../servicios/historial";
import { FILTROS_INICIALES, type Filtros, hayFiltros } from "../utilidades/filtros";
import { rangoInvertido, useConsultaDelHistorial } from "./consulta-del-historial";

interface FiltrosDelHistorialProps {
  autores: Autor[];
  /** Lo que no se pudo aplicar de la dirección, como un rango de fechas invertido. */
  aviso?: string;
}

const ROL: Record<Autor["rol"], string> = { ADMINISTRADOR: "administración", RECEPCIONISTA: "recepción" };

function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[0.7rem] font-bold tracking-wide text-grava uppercase">{etiqueta}</label>
      {children}
    </div>
  );
}

/** Al cambiar de categoría, una acción que no le corresponde se quita. */
function alElegirCategoria(categoria: Categoria | "", filtros: Filtros): Partial<Filtros> {
  const valeLaAccion = !categoria || !filtros.accion || ACCIONES_POR_CATEGORIA[categoria].includes(filtros.accion);
  return { categoria, accion: valeLaAccion ? filtros.accion : "" };
}

/** Las categorías como atajos de un toque, en una fila que se desliza en el celular. */
function Categorias() {
  const { filtros, aplicar } = useConsultaDelHistorial();
  const opciones: { valor: Categoria | ""; texto: string }[] = [{ valor: "", texto: "Todas" }, ...CATEGORIAS];
  return (
    <div role="group" aria-label="Categoría" className="categorias-del-historial">
      {opciones.map(({ valor, texto }) => (
        <button key={texto} type="button" aria-pressed={filtros.categoria === valor} data-categoria={valor || undefined} onClick={() => aplicar(alElegirCategoria(valor, filtros))}>
          {texto}
        </button>
      ))}
    </div>
  );
}

/** Persona, acción (solo las de la categoría elegida) y las fechas exactas. */
function Campos({ autores, invertido }: { autores: Autor[]; invertido: boolean }) {
  const { filtros, aplicar } = useConsultaDelHistorial();
  const acciones = filtros.categoria ? ACCIONES.filter((a) => ACCIONES_POR_CATEGORIA[filtros.categoria as Categoria].includes(a.valor)) : ACCIONES;
  return (
    <div className="campos-del-historial">
      <Campo id="filtro-persona" etiqueta="Persona">
        <select id="filtro-persona" value={filtros.autor} onChange={(e) => aplicar({ autor: e.target.value })} className="campo-del-historial">
          <option value="">Todas</option>
          {autores.map((autor) => <option key={autor.id} value={autor.id}>{`${autor.nombre} · ${ROL[autor.rol]}`}</option>)}
        </select>
      </Campo>
      <Campo id="filtro-accion" etiqueta="Acción">
        <select id="filtro-accion" value={filtros.accion} onChange={(e) => aplicar({ accion: e.target.value as Filtros["accion"] })} className="campo-del-historial">
          <option value="">Todas</option>
          {acciones.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
        </select>
      </Campo>
      <Campo id="filtro-desde" etiqueta="Desde">
        <input id="filtro-desde" type="date" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} className="campo-del-historial" />
      </Campo>
      <Campo id="filtro-hasta" etiqueta="Hasta">
        <input id="filtro-hasta" type="date" value={filtros.hasta} aria-invalid={invertido || undefined} onChange={(e) => aplicar({ hasta: e.target.value })} className="campo-del-historial" />
      </Campo>
    </div>
  );
}

/** Solo importantes y el orden. */
function Opciones() {
  const { filtros, aplicar } = useConsultaDelHistorial();
  const antiguos = filtros.orden === "ANTIGUOS";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={filtros.soloImportantes} onClick={() => aplicar({ soloImportantes: !filtros.soloImportantes })} className="interruptor-del-historial">
        <span aria-hidden="true" className="punto-importante" />
        Solo importantes
      </button>
      <div role="group" aria-label="Orden" className="segmento-del-historial">
        <button type="button" aria-pressed={!antiguos} onClick={() => aplicar({ orden: "RECIENTES" })}>Más recientes</button>
        <button type="button" aria-pressed={antiguos} onClick={() => aplicar({ orden: "ANTIGUOS" })}>Más antiguos</button>
      </div>
    </div>
  );
}

/** Barra de filtros: categorías de un toque arriba; persona, acción, fechas y opciones debajo. */
export function FiltrosDelHistorial({ autores, aviso }: FiltrosDelHistorialProps) {
  const { filtros, consultar } = useConsultaDelHistorial();
  const invertido = rangoInvertido(filtros);
  const mensaje = invertido ? "La fecha final es anterior a la inicial: elige otra para filtrar por fechas." : aviso;
  return (
    <section aria-label="Filtros" className="filtros-del-historial">
      <div className="flex items-center gap-2">
        <Categorias />
        {(hayFiltros(filtros) || aviso) && (
          <button type="button" onClick={() => consultar(FILTROS_INICIALES)} className="limpiar-del-historial">
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="filtros-del-historial__fila">
        <Campos autores={autores} invertido={invertido} />
        <Opciones />
      </div>
      {mensaje && <p role="alert" className="aviso-del-historial">{mensaje}</p>}
    </section>
  );
}
