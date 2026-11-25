"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { enviarJson } from "../api/enviar-json";
import { escucharAvisos } from "../avisos/canal-de-avisos";

/** Cuántas hojas faltan responder; se pone al día con cada aviso y al cambiar de pantalla. */
function useReclamosPorResponder() {
  const [porResponder, setPorResponder] = useState(0);
  const cargar = useCallback(async () => {
    const respuesta = await enviarJson<{ conteos: { POR_RESPONDER: number } }>("/api/reclamos?porPagina=10", "GET");
    if (respuesta.tipo === "aceptado") setPorResponder(respuesta.cuerpo.conteos.POR_RESPONDER);
  }, []);
  return { porResponder, cargar };
}

/** Número junto a «Reclamos» en la barra de administración. Sin pendientes no se muestra. */
export function ContadorDeReclamos() {
  const { porResponder, cargar } = useReclamosPorResponder();
  const ruta = usePathname();
  useEffect(() => {
    void cargar();
  }, [cargar, ruta]);
  useEffect(() => escucharAvisos(() => void cargar()), [cargar]);
  if (porResponder === 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-5 justify-center rounded-full bg-error px-1.5 text-xs leading-5 font-bold text-white tabular-nums">
      {porResponder}
      <span className="sr-only"> por responder</span>
    </span>
  );
}
