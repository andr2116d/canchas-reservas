"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { escucharCambios } from "@/compartido/disponibilidad/avisos-de-cambios";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { conElTurno, type TurnoElegido } from "@/compartido/sesion/turno-elegido";
import type { ResumenDeReserva } from "../servicios/reservas";
import { consultarResumen } from "../servicios/reservas.api";

export type EstadoDelResumen =
  | { tipo: "cargando" }
  | { tipo: "listo"; resumen: ResumenDeReserva }
  | { tipo: "no-disponible"; mensaje: string }
  | { tipo: "error"; mensaje: string };

const ESPERA_PARA_AGRUPAR_MS = 300;

/** Pide el resumen; la consulta anterior se cancela. Sin sesión, vuelve a ingresar con el turno. */
function useConsultaDelResumen({ canchaId, fecha, desde }: TurnoElegido) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoDelResumen>({ tipo: "cargando" });
  const enCurso = useRef<AbortController | undefined>(undefined);

  const recargar = useCallback(async () => {
    enCurso.current?.abort();
    const control = new AbortController();
    enCurso.current = control;
    const turno = { canchaId, fecha, desde };
    const resultado = await consultarResumen(turno, control.signal);
    if (control.signal.aborted) return;
    if (resultado.tipo === "sin-sesion") return router.replace(conElTurno(RUTA_DE_ACCESO, turno));
    if (resultado.tipo === "consultado") return setEstado({ tipo: "listo", resumen: resultado.resumen });
    // Una falla pasajera al volver a pedirlo no borra el resumen que ya se ve.
    setEstado((actual) => (resultado.tipo === "error" && actual.tipo === "listo" ? actual : resultado));
  }, [canchaId, fecha, desde, router]);

  useEffect(() => () => enCurso.current?.abort(), []);
  return { estado, recargar };
}

/**
 * El resumen del turno elegido. Se vuelve a pedir cuando cambia el mapa de turnos: si
 * alguien separa el turno mientras se revisa, la pantalla lo dice.
 */
export function useResumenDeReserva(turno: TurnoElegido) {
  const { estado, recargar } = useConsultaDelResumen(turno);

  useEffect(() => {
    void recargar();
    let espera: ReturnType<typeof setTimeout> | undefined;
    const dejarDeEscuchar = escucharCambios({
      alCambiar: () => {
        clearTimeout(espera);
        espera = setTimeout(() => void recargar(), ESPERA_PARA_AGRUPAR_MS);
      },
      alCambiarConexion: () => undefined,
    });
    return () => {
      clearTimeout(espera);
      dejarDeEscuchar();
    };
  }, [recargar]);

  return { estado, recargar };
}
