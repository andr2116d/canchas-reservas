"use client";

import { useState } from "react";
import { SECCIONES_DE_LA_PORTADA } from "./rutas-del-sitio";

/** Secciones de la portada: en la barra en pantallas anchas; en el celular, tras el botón «Menú». */
export function MenuDelSitio() {
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
        </ul>
      </nav>
      <button type="button" aria-expanded={abierto} aria-controls="menu-del-sitio" onClick={() => setAbierto(!abierto)} className="menu-del-sitio__boton">
        {abierto ? "Cerrar" : "Menú"}
      </button>
    </>
  );
}
