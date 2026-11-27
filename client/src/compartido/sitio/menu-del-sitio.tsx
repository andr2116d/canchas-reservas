"use client";

import Link from "next/link";
import { useState } from "react";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { SECCIONES_DE_LA_PORTADA } from "./rutas-del-sitio";

/**
 * Secciones de la portada: en la barra en pantallas anchas; en el celular, tras el botón «Menú».
 * Sin sesión, el menú del celular también lleva a ingresar, porque ahí la barra no tiene espacio.
 */
export function MenuDelSitio({ mostrarIngreso = false }: { mostrarIngreso?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <nav id="menu-del-sitio" aria-label="Principal" data-abierto={abierto ? "" : undefined} className="menu-del-sitio">
        <ul>
          {SECCIONES_DE_LA_PORTADA.map((seccion) => (
            <li key={seccion.ruta}>
              <a href={seccion.ruta} onClick={() => setAbierto(false)}>{seccion.texto}</a>
            </li>
          ))}
          {mostrarIngreso && (
            <li className="lg:hidden">
              <Link href={RUTA_DE_ACCESO} onClick={() => setAbierto(false)}>Ingresar</Link>
            </li>
          )}
        </ul>
      </nav>
      <button type="button" aria-expanded={abierto} aria-controls="menu-del-sitio" onClick={() => setAbierto(!abierto)} className="menu-del-sitio__boton">
        {abierto ? "Cerrar" : "Menú"}
      </button>
    </>
  );
}
