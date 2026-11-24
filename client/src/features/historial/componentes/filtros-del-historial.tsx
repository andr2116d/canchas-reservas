"use client";

import { type ReactNode, useState } from "react";
import { TARJETA } from "@/compartido/ui/estilos";
import { ACCIONES, ACCIONES_POR_CATEGORIA, type Autor, CATEGORIAS, type Categoria } from "../servicios/historial";
import { aDireccion, FILTROS_INICIALES, type Filtros, hayFiltros } from "../utilidades/filtros";
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

/**
 * Lo que la barra muestra: se actualiza al instante con cada cambio, para que dos cambios
 * seguidos se sumen aunque la página aún no llegue. Si la dirección cambia por otra vía
 * (páginas, limpiar), se toma de nuevo.
 */
function useFiltrosEnPantalla(filtros: Filtros) {
  const [enPantalla, setEnPantalla] = useState(filtros);
  const [origen, setOrigen] = useState(aDireccion(filtros));
  if (aDireccion(filtros) !== origen) {
    setOrigen(aDireccion(filtros));
    setEnPantalla(filtros);
  }
  return [enPantalla, setEnPantalla] as const;
}

const invertido = ({ desde, hasta }: Pick<Filtros, "desde" | "hasta">) => Boolean(desde && hasta && hasta < desde);

/** Filtros combinables en una barra compacta; cada cambio consulta de nuevo desde la primera página. */
export function FiltrosDelHistorial({ filtros, autores, aviso }: FiltrosDelHistorialProps) {
  const consultar = useConsultarHistorial();
  const [enPantalla, setEnPantalla] = useFiltrosEnPantalla(filtros);
  const aplicar: Aplicar = (cambios) => {
    const nuevos = { ...enPantalla, ...cambios, pagina: 1 };
    setEnPantalla(nuevos);
    // Un rango invertido no se consulta: se avisa y se espera otra fecha.
    if (!invertido(nuevos)) consultar(nuevos);
  };
  const limpiar = () => {
    setEnPantalla(FILTROS_INICIALES);
    consultar(FILTROS_INICIALES);
  };
  const rangoInvertido = invertido(enPantalla);
  const mensaje = rangoInvertido ? "La fecha final es anterior a la inicial: elige otra para filtrar por fechas." : aviso;

  return (
    <section aria-label="Filtros" className={`${TARJETA} flex flex-col gap-3 !p-4 sm:!p-5`}>
      <div className="filtros-del-historial grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_9.5rem_9.5rem]">
        <Selectores filtros={enPantalla} autores={autores} aplicar={aplicar} />
        <Campo id="filtro-desde" etiqueta="Desde">
          <input id="filtro-desde" type="date" value={enPantalla.desde} onChange={(e) => aplicar({ desde: e.target.value })} className="campo-del-historial" />
        </Campo>
        <Campo id="filtro-hasta" etiqueta="Hasta">
          <input id="filtro-hasta" type="date" value={enPantalla.hasta} aria-invalid={rangoInvertido || undefined} onChange={(e) => aplicar({ hasta: e.target.value })} className="campo-del-historial" />
        </Campo>
      </div>
      <Opciones filtros={enPantalla} aplicar={aplicar} limpiar={hayFiltros(enPantalla) || aviso ? limpiar : undefined} />
      {mensaje && <p role="alert" className="rounded-lg bg-[#fbf1d9] px-3 py-2 text-sm font-semibold text-tinta">{mensaje}</p>}
    </section>
  );
}
