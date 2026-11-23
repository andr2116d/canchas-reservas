"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import type { Rol } from "../sesion/destino-de-sesion";
import { useCerrarSesion } from "../sesion/use-cerrar-sesion";
import { useVigenciaDeSesion } from "../sesion/use-vigencia-de-sesion";
import {
  esSeccionActual,
  NOMBRE_DEL_PANEL,
  RUTA_DE_LA_CUENTA,
  SECCIONES_DEL_PANEL,
} from "./secciones-del-panel";

function EnlaceALaCuenta({ rol }: { rol: Rol }) {
  const ruta = RUTA_DE_LA_CUENTA[rol];
  const actual = usePathname().startsWith(ruta);
  return (
    <Link href={ruta} aria-current={actual ? "page" : undefined} className="barra-de-vidrio__cuenta">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" focusable="false">
        <circle cx="10" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 17c1.2-3.2 3.6-4.6 6.5-4.6s5.3 1.4 6.5 4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span>Mi cuenta</span>
    </Link>
  );
}

function SeccionesDelRol({ rol }: { rol: Rol }) {
  const rutaActual = usePathname();
  const secciones = SECCIONES_DEL_PANEL[rol];

  return (
    <nav aria-label="Secciones" className="barra-de-vidrio__secciones">
      {secciones.map((seccion) => {
        const actual = esSeccionActual(seccion, secciones[0].ruta, rutaActual);
        return (
          <Link
            key={seccion.ruta}
            href={seccion.ruta}
            aria-current={actual ? "page" : undefined}
            className="barra-de-vidrio__seccion"
          >
            {seccion.texto}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Barra de vidrio de las pantallas internas: identifica el panel del rol, lleva
 * a sus secciones y cierra la sesión. Sin rol, solo ofrece cerrar la sesión.
 */
export function BarraDeNavegacion({ rol, venceEn }: { rol?: Rol; venceEn: string }) {
  const { cerrar, cerrando, error } = useCerrarSesion();
  useVigenciaDeSesion(venceEn);

  return (
    <header className="barra-de-vidrio">
      <div className="barra-de-vidrio__fila">
        <div className="flex items-center gap-3">
          <MonogramaLaPrevia className="h-9 w-auto" />
          <span className="font-titular text-xl leading-none font-black text-papel max-sm:sr-only">La Previa</span>
          {rol && <span className="sello-del-rol">{NOMBRE_DEL_PANEL[rol]}</span>}
        </div>
        {rol && <SeccionesDelRol rol={rol} />}
        <div className="flex items-center gap-1">
          {rol && <EnlaceALaCuenta rol={rol} />}
          <button type="button" onClick={cerrar} disabled={cerrando} className="barra-de-vidrio__salir">
            {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="px-1 pt-2 text-sm font-semibold text-[#ffd2cf]">No pudimos cerrar tu sesión. Inténtalo de nuevo.</p>}
    </header>
  );
}
