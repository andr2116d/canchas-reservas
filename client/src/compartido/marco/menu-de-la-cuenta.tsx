"use client";

import Link from "next/link";
import { useId } from "react";
import type { Rol } from "../sesion/destino-de-sesion";
import { OPCIONES_DE_LA_CUENTA } from "./secciones-del-panel";
import { useMenuDesplegable } from "./use-menu-desplegable";

interface MenuDeLaCuentaProps {
  rol: Rol;
  cerrar: () => void;
  cerrando: boolean;
}

function IconoDeLaCuenta() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" focusable="false">
      <circle cx="10" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 17c1.2-3.2 3.6-4.6 6.5-4.6s5.3 1.4 6.5 4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** «Mi cuenta» como menú desplegable de vidrio: las opciones del rol y, al final, cerrar la sesión. */
export function MenuDeLaCuenta({ rol, cerrar, cerrando }: MenuDeLaCuentaProps) {
  const { abierto, alternar, cerrarMenu, contenedor, boton, ruta } = useMenuDesplegable();
  const id = useId();
  const opciones = OPCIONES_DE_LA_CUENTA[rol];
  const enUnaOpcion = opciones.some((opcion) => ruta.startsWith(opcion.ruta));

  return (
    <div ref={contenedor} className="menu-de-la-cuenta">
      <button ref={boton} type="button" aria-expanded={abierto} aria-controls={id} onClick={alternar} data-actual={enUnaOpcion || undefined} className="barra-de-vidrio__cuenta">
        <IconoDeLaCuenta />
        {/* En el celular y en la barra de administración (muchas secciones), solo el ícono; el nombre no cambia. */}
        <span className="max-sm:sr-only min-[70rem]:group-data-muchas-secciones:sr-only">Mi cuenta</span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className="menu-de-la-cuenta__flecha size-3" focusable="false">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {abierto && (
        <div id={id} className="menu-de-la-cuenta__panel">
          <ul className="flex flex-col">
            {opciones.map((opcion) => (
              <li key={opcion.ruta}>
                <Link href={opcion.ruta} onClick={cerrarMenu} aria-current={ruta.startsWith(opcion.ruta) ? "page" : undefined} className="menu-de-la-cuenta__opcion">
                  {opcion.texto}
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" onClick={cerrar} disabled={cerrando} className="menu-de-la-cuenta__opcion menu-de-la-cuenta__salir">
            {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
