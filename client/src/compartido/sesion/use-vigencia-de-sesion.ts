"use client";

import { useEffect } from "react";
import { RUTA_DE_ACCESO } from "./destino-de-sesion";
import { consultarSesion } from "./sesion.api";

const EVENTO_DE_SALIDA = "la-previa:salida";
const REINTENTO_TRAS_FALLO = 10_000;

export function salirDelPanel(): void {
  try {
    localStorage.setItem(EVENTO_DE_SALIDA, String(Date.now()));
  } catch {
    // El cierre de la sesión se aplica aunque el navegador bloquee el almacenamiento.
  }
  window.location.replace(RUTA_DE_ACCESO);
}

export function useVigenciaDeSesion(venceEn: string): void {
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>;
    let vigente = true;
    let consultando = false;

    function programar(retraso: number) {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => void verificar(), Math.max(0, retraso));
    }
    async function verificar() {
      if (!vigente || consultando) return;
      consultando = true;
      try {
        const sesion = await consultarSesion();
        if (!vigente) return;
        if (sesion) programar(Date.parse(sesion.venceEn) - Date.now());
        else window.location.replace(`${RUTA_DE_ACCESO}?motivo=inactividad`);
      } catch {
        if (vigente) programar(REINTENTO_TRAS_FALLO);
      } finally {
        consultando = false;
      }
    }
    const alRestaurar = (evento: PageTransitionEvent) => {
      if (evento.persisted) void verificar();
    };
    const alCerrarEnOtraPestana = (evento: StorageEvent) => {
      if (evento.key === EVENTO_DE_SALIDA) window.location.replace(RUTA_DE_ACCESO);
    };

    programar(Date.parse(venceEn) - Date.now());
    window.addEventListener("pageshow", alRestaurar);
    window.addEventListener("storage", alCerrarEnOtraPestana);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
      window.removeEventListener("pageshow", alRestaurar);
      window.removeEventListener("storage", alCerrarEnOtraPestana);
    };
  }, [venceEn]);
}
