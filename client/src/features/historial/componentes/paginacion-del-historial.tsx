"use client";

import type { PaginaDelHistorial } from "../servicios/historial";
import { type Filtros, TAMANOS_DE_PAGINA } from "../utilidades/filtros";
import { useConsultarHistorial } from "./consulta-del-historial";

/** Hasta cinco números de página alrededor de la actual. */
function paginasVisibles(actual: number, total: number): number[] {
  const inicio = Math.max(1, Math.min(actual - 2, total - 4));
  return Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
}

/** Qué registros se ven, cuántos hay, el cambio de página y cuántos mostrar por página. */
export function PaginacionDelHistorial({ pagina, filtros }: { pagina: PaginaDelHistorial; filtros: Filtros }) {
  const consultar = useConsultarHistorial();
  if (pagina.total === 0) return null;
  const desde = (pagina.pagina - 1) * pagina.porPagina + 1;
  const hasta = Math.min(pagina.pagina * pagina.porPagina, pagina.total);
  const ir = (numero: number) => consultar({ ...filtros, pagina: numero });

  return (
    <nav aria-label="Páginas del historial" className="paginacion-del-historial">
      <p className="text-sm text-grava tabular-nums">{`${desde}–${hasta} de ${pagina.total}`}</p>
      {pagina.paginas > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" disabled={pagina.pagina <= 1} onClick={() => ir(pagina.pagina - 1)} className="paginacion-del-historial__paso">Anterior</button>
          {paginasVisibles(pagina.pagina, pagina.paginas).map((numero) => (
            <button key={numero} type="button" aria-current={numero === pagina.pagina ? "page" : undefined} aria-label={`Página ${numero}`} onClick={() => ir(numero)} className="paginacion-del-historial__numero">
              {numero}
            </button>
          ))}
          <button type="button" disabled={pagina.pagina >= pagina.paginas} onClick={() => ir(pagina.pagina + 1)} className="paginacion-del-historial__paso">Siguiente</button>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-grava">
        Por página
        <select value={pagina.porPagina} onChange={(e) => consultar({ ...filtros, pagina: 1, porPagina: Number(e.target.value) })} className="campo-del-historial !w-auto !py-1">
          {TAMANOS_DE_PAGINA.map((tamano) => <option key={tamano} value={tamano}>{tamano}</option>)}
        </select>
      </label>
    </nav>
  );
}
