"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCerrarSesion } from "../hooks";
import { leerUltimaActividad, registrarActividad } from "../sesion-compartida";

export const LIMITE_INACTIVIDAD_MS = 15 * 60 * 1000;
export const INTERVALO_COMPARTIR_MS = 5000;
const DESTINO = "/login?motivo=inactividad";
const EVENTOS = ["click", "keydown", "scroll"] as const;

export function TemporizadorInactividad() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate } = useCerrarSesion(DESTINO);

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let pendiente = false;
    let ultima = Date.now();

    const programar = (ms: number) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(vencer, ms);
    };

    const vencer = () => {
      const restante = Math.max(ultima, leerUltimaActividad()) + LIMITE_INACTIVIDAD_MS - Date.now();
      if (restante > 0) return programar(restante);
      mutate(undefined, {
        onError: () => {
          router.replace(DESTINO);
          queryClient.clear();
        },
      });
    };

    const compartir = () => {
      if (espera !== undefined) {
        pendiente = true;
        return;
      }
      registrarActividad(ultima);
      espera = setTimeout(() => {
        espera = undefined;
        if (pendiente) {
          pendiente = false;
          compartir();
        }
      }, INTERVALO_COMPARTIR_MS);
    };

    const reiniciar = () => {
      ultima = Date.now();
      compartir();
      programar(LIMITE_INACTIVIDAD_MS);
    };

    reiniciar();
    EVENTOS.forEach((evento) => document.addEventListener(evento, reiniciar, { capture: true, passive: true }));
    return () => {
      clearTimeout(temporizador);
      clearTimeout(espera);
      if (pendiente) registrarActividad(ultima);
      EVENTOS.forEach((evento) => document.removeEventListener(evento, reiniciar, { capture: true }));
    };
  }, [mutate, router, queryClient]);

  return null;
}
