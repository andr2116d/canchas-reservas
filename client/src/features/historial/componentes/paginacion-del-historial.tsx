"use client";

import type { PaginaDelHistorial } from "../servicios/historial";
import { TAMANOS_DE_PAGINA } from "../utilidades/filtros";
import { useConsultaDelHistorial } from "./consulta-del-historial";

/** La primera, la última y las dos vecinas de la actual; los saltos se marcan con «…». */
export function paginasVisibles(actual: number, total: number): (number | "…")[] {
  const cercanas = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total));
  const ordenadas = [...cercanas].sort((a, b) => a - b);
  return ordenadas.flatMap((numero, i) => (i > 0 && numero - ordenadas[i - 1] > 1 ? ["…" as const, numero] : [numero]));
}

/** Arriba de la lista: qué registros se ven, cuántos hay y cuántos mostrar por página. */
export function ResumenDeResultados({ pagina }: { pagina: PaginaDelHistorial }) {
  const { irAPagina } = useConsultaDelHistorial();
  if (pagina.total === 0) return null;
  const desde = (pagina.pagina - 1) * pagina.porPagina + 1;
  const hasta = Math.min(pagina.pagina * pagina.porPagina, pagina.total);
  return (
    <div className="resumen-del-historial">
      <p aria-live="polite" className="text-sm text-grava">
        <b className="font-titular text-lg font-black text-tinta tabular-nums">{`${desde}–${hasta}`}</b> <span>{`de ${pagina.total} registros`}</span>
      </p>
      <div role="group" aria-label="Por página" className="segmento-del-historial segmento-del-historial--chico">
        {TAMANOS_DE_PAGINA.map((tamano) => (
          <button key={tamano} type="button" aria-pressed={pagina.porPagina === tamano} onClick={() => irAPagina({ pagina: 1, porPagina: tamano })}>
            {tamano}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Al pie de la lista: anterior, los números con saltos y siguiente. */
export function PaginacionDelHistorial({ pagina }: { pagina: PaginaDelHistorial }) {
  const { irAPagina } = useConsultaDelHistorial();
  if (pagina.paginas <= 1) return null;
  const ir = (numero: number) => irAPagina({ pagina: numero });
  return (
    <nav aria-label="Páginas del historial" className="paginacion-del-historial">
      <button type="button" aria-label="Página anterior" disabled={pagina.pagina <= 1} onClick={() => ir(pagina.pagina - 1)} className="paginacion-del-historial__paso">
        <span aria-hidden="true">‹</span> Anterior
      </button>
      <div className="flex items-center gap-1">
        {paginasVisibles(pagina.pagina, pagina.paginas).map((numero, i) =>
          numero === "…" ? (
            <span key={`salto-${i}`} aria-hidden="true" className="px-1 text-grava">…</span>
          ) : (
            <button key={numero} type="button" aria-current={numero === pagina.pagina ? "page" : undefined} aria-label={`Página ${numero}`} onClick={() => ir(numero)} className="paginacion-del-historial__numero">
              {numero}
            </button>
          ),
        )}
      </div>
      <button type="button" aria-label="Página siguiente" disabled={pagina.pagina >= pagina.paginas} onClick={() => ir(pagina.pagina + 1)} className="paginacion-del-historial__paso">
        Siguiente <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
