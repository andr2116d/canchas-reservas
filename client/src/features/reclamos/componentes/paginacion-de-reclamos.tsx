import Link from "next/link";
import type { PaginaDeHojas } from "../servicios/reclamos";
import { aDireccion, type FiltrosDeReclamos, TAMANOS_DE_PAGINA } from "../utilidades/filtros";

const ENLACE = "rounded-lg px-3 py-1.5 text-sm font-semibold text-botella hover:bg-tiza aria-disabled:pointer-events-none aria-disabled:opacity-40";

/** Arriba: qué hojas se ven y cuántas mostrar. Abajo: cómo pasar de página, solo si hay más de una. */
export function PaginacionDeReclamos({ pagina, filtros, abajo = false }: { pagina: PaginaDeHojas; filtros: FiltrosDeReclamos; abajo?: boolean }) {
  if (pagina.total === 0) return null;
  const desde = (pagina.pagina - 1) * pagina.porPagina + 1;
  const hasta = Math.min(pagina.pagina * pagina.porPagina, pagina.total);
  const paginas = Math.ceil(pagina.total / pagina.porPagina);
  const a = (cambios: Partial<FiltrosDeReclamos>) => aDireccion({ ...filtros, ...cambios });
  if (abajo && paginas <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-grava">
      <p aria-live="polite">
        <b className="font-titular text-lg font-black text-tinta tabular-nums">{`${desde}–${hasta}`}</b> de {pagina.total}
      </p>
      {paginas > 1 && (
        <nav aria-label="Páginas" className="flex items-center gap-1">
          <Link href={a({ pagina: pagina.pagina - 1 })} aria-disabled={pagina.pagina <= 1} className={ENLACE}>‹ Anterior</Link>
          <span className="px-2 tabular-nums">{pagina.pagina} de {paginas}</span>
          <Link href={a({ pagina: pagina.pagina + 1 })} aria-disabled={pagina.pagina >= paginas} className={ENLACE}>Siguiente ›</Link>
        </nav>
      )}
      {!abajo && (
        <div role="group" aria-label="Por página" className="flex items-center gap-1">
          {TAMANOS_DE_PAGINA.map((tamano) => (
            <Link key={tamano} href={a({ porPagina: tamano, pagina: 1 })} aria-current={pagina.porPagina === tamano ? "true" : undefined} className={`${ENLACE} aria-[current=true]:bg-cancha aria-[current=true]:text-papel`}>
              {tamano}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
