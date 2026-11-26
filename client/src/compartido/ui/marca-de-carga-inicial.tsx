"use client";

import { useEffect } from "react";

/**
 * Marca la página como lista cuando el navegador terminó de recibirla. Hasta
 * entonces, toda carga de contenido se ve como la cancha completa: al entrar o
 * recargar hay una sola carga, no una tras otra.
 */
export function MarcaDeCargaInicial() {
  useEffect(() => {
    const marcar = () => {
      document.documentElement.dataset.cargaInicial = "lista";
    };
    if (document.readyState === "complete") return marcar();
    window.addEventListener("load", marcar, { once: true });
    return () => window.removeEventListener("load", marcar);
  }, []);
  return null;
}
