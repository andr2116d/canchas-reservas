"use client";

import { useEffect, useState } from "react";

const MS_POR_SEGUNDO = 1000;

/**
 * Segundos que faltan para `venceEn`, medidos con la hora del server (`ahora`) y no con
 * el reloj del dispositivo, que puede estar desfasado. Sin vencimiento, nada.
 */
export function useCuentaRegresiva(venceEn: string | null, ahora: string): number | undefined {
  const inicial = venceEn ? Math.max(0, Math.floor((new Date(venceEn).getTime() - new Date(ahora).getTime()) / MS_POR_SEGUNDO)) : undefined;
  const [transcurridos, setTranscurridos] = useState(0);

  useEffect(() => {
    if (inicial === undefined || inicial === 0) return;
    const desde = Date.now();
    const reloj = setInterval(() => setTranscurridos(Math.floor((Date.now() - desde) / MS_POR_SEGUNDO)), MS_POR_SEGUNDO / 4);
    return () => clearInterval(reloj);
  }, [inicial]);

  return inicial === undefined ? undefined : Math.max(0, inicial - transcurridos);
}
