"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CampanaDeAvisos } from "@/compartido/avisos/campana-de-avisos";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import type { Rol } from "../sesion/destino-de-sesion";
import { useCerrarSesion } from "../sesion/use-cerrar-sesion";
import { useVigenciaDeSesion } from "../sesion/use-vigencia-de-sesion";
import { ContadorDeReclamos } from "./contador-de-reclamos";
import { MenuDeLaCuenta } from "./menu-de-la-cuenta";
import { esSeccionActual, NOMBRE_DEL_PANEL, SECCIONES_DEL_PANEL } from "./secciones-del-panel";

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
            {seccion.contador === "reclamos" && <ContadorDeReclamos />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Con más secciones, la barra pasa a dos filas bajo 1120 px y deja solo íconos en una fila. */
const MAXIMO_DE_SECCIONES_EN_UNA_FILA = 4;

interface BarraDeNavegacionProps {
  rol?: Rol;
  venceEn: string;
  /** Sin secciones ni cuenta, como mientras se pide cambiar la contraseña temporal. */
  conSecciones?: boolean;
}

/**
 * Barra de vidrio de las pantallas internas: identifica el panel del rol, lleva
 * a sus secciones y, desde el menú de la cuenta, a la cuenta y a cerrar la sesión.
 */
export function BarraDeNavegacion({ rol, venceEn, conSecciones = true }: BarraDeNavegacionProps) {
  const { cerrar, cerrando, error } = useCerrarSesion();
  useVigenciaDeSesion(venceEn);

  return (
    <header className="barra-de-vidrio group" data-muchas-secciones={rol && conSecciones && SECCIONES_DEL_PANEL[rol].length > MAXIMO_DE_SECCIONES_EN_UNA_FILA ? "" : undefined}>
      <div className="barra-de-vidrio__fila">
        <div className="flex items-center gap-3">
          <MonogramaLaPrevia className="h-9 w-auto" />
          <span className="font-titular text-xl leading-none font-black text-papel max-sm:sr-only min-[70rem]:group-data-muchas-secciones:sr-only">La Previa</span>
          {rol && <span className="sello-del-rol">{NOMBRE_DEL_PANEL[rol]}</span>}
        </div>
        {rol && conSecciones && <SeccionesDelRol rol={rol} />}
        <div className="flex items-center gap-1">
          {rol && conSecciones ? (
            <>
              <CampanaDeAvisos />
              <MenuDeLaCuenta rol={rol} cerrar={cerrar} cerrando={cerrando} />
            </>
          ) : (
            <button type="button" onClick={cerrar} disabled={cerrando} className="barra-de-vidrio__salir">
              {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="px-1 pt-2 text-sm font-semibold text-[#ffd2cf]">No pudimos cerrar tu sesión. Inténtalo de nuevo.</p>}
    </header>
  );
}
