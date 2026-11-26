import type { ReactNode } from "react";
import { AvisoDeCookies } from "./aviso-de-cookies";
import { BarraDelSitio } from "./barra-del-sitio";
import { PieDelSitio } from "./pie-del-sitio";

/** Barra, contenido, pie y aviso de cookies comunes a la portada y las páginas legales. */
export function MarcoDelSitio({ children }: { children: ReactNode }) {
  return (
    <div className="sitio">
      <a href="#contenido" className="saltar-al-contenido">Saltar al contenido</a>
      <div className="print:hidden">
        <BarraDelSitio />
      </div>
      <main id="contenido" tabIndex={-1} className="outline-none">{children}</main>
      <div className="print:hidden">
        <PieDelSitio />
        <AvisoDeCookies />
      </div>
    </div>
  );
}
