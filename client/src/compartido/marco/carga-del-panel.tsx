"use client";

import { usePathname } from "next/navigation";
import { CargaDeContenido } from "../ui/carga-de-contenido";
import { esSeccionActual, RUTA_DE_LA_CUENTA, SECCIONES_DEL_PANEL } from "./secciones-del-panel";
import type { Rol } from "../sesion/destino-de-sesion";

const TITULO_DE_LA_CUENTA = "Mi cuenta";

/** Nombre de la sección a la que se va, según la ruta; la cuenta se llama «Mi cuenta». */
function tituloDeLaRuta(ruta: string): string {
  for (const rol of Object.keys(SECCIONES_DEL_PANEL) as Rol[]) {
    const cuenta = RUTA_DE_LA_CUENTA[rol];
    if (ruta === cuenta || ruta.startsWith(`${cuenta}/`)) return TITULO_DE_LA_CUENTA;
    const secciones = SECCIONES_DEL_PANEL[rol];
    const seccion = secciones.find((posible) => esSeccionActual(posible, secciones[0].ruta, ruta));
    if (seccion) return seccion.texto;
  }
  return "La Previa";
}

/**
 * Lo que se ve al cambiar de sección del panel: la barra y la cancha del
 * encabezado no se mueven, el título aparece al instante y solo el contenido espera.
 */
export function CargaDelPanel() {
  const titulo = tituloDeLaRuta(usePathname());
  return (
    <>
      <header className="encabezado-de-seccion">
        <h1 className="font-titular text-5xl leading-none font-black text-balance text-papel sm:text-6xl">{titulo}</h1>
      </header>
      <CargaDeContenido texto={`Cargando ${titulo.toLowerCase()}…`} />
    </>
  );
}
