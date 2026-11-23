"use client";

import { useEffect, useState } from "react";
import { useReglaEnEdicion } from "../componentes/proveedor-de-la-regla";
import { simularCancelacion } from "../servicios/cancelacion.api";
import type { Compensacion } from "../servicios/cancelacion";

// Espera a que se termine de escribir antes de preguntar al server.
const PAUSA_MS = 350;

export interface CasoDeEjemplo {
  anticipo: string;
  pagado: string;
  minutosDeAnticipacion: number;
}

/**
 * Pide al server lo que recibiría el jugador con la regla en edición y el caso
 * elegido. Los errores de la regla se avisan en la tarjeta; los del caso, aquí.
 */
export function useSimulacionDeCancelacion(caso: CasoDeEjemplo) {
  const { rangos, avisar } = useReglaEnEdicion();
  const [compensacion, setCompensacion] = useState<Compensacion>();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [calculando, setCalculando] = useState(false);
  const clave = JSON.stringify({ rangos, ...caso });

  useEffect(() => {
    const datos = JSON.parse(clave) as CasoDeEjemplo & { rangos?: Compensacion[] };
    if (!datos.rangos) return;
    const control = new AbortController();
    const espera = setTimeout(() => {
      setCalculando(true);
      void simularCancelacion(datos as never, control.signal).then((resultado) => {
        if (control.signal.aborted) return;
        setCalculando(false);
        const deLaRegla = resultado.tipo === "rechazada" ? Object.entries(resultado.errores).find(([campo]) => campo.startsWith("rangos")) : undefined;
        avisar(deLaRegla?.[1]);
        setErrores(resultado.tipo === "rechazada" ? resultado.errores : resultado.tipo === "error" ? { general: resultado.mensaje } : {});
        if (resultado.tipo === "simulada") setCompensacion(resultado.compensacion);
      });
    }, PAUSA_MS);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [clave, avisar]);

  return { compensacion, errores, calculando, reglaValida: Boolean(rangos) };
}
