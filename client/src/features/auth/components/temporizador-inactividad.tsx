"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCerrarSesion } from "../hooks";

export const LIMITE_INACTIVIDAD_MS = 15 * 60 * 1000;
const DESTINO = "/login?motivo=inactividad";
const EVENTOS = ["click", "keydown", "scroll"] as const;

export function TemporizadorInactividad() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate } = useCerrarSesion(DESTINO);

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>;

    const vencer = () =>
      mutate(undefined, {
        onError: () => {
          router.replace(DESTINO);
          queryClient.clear();
        },
      });

    const reiniciar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(vencer, LIMITE_INACTIVIDAD_MS);
    };

    reiniciar();
    EVENTOS.forEach((evento) => document.addEventListener(evento, reiniciar, { capture: true, passive: true }));
    return () => {
      clearTimeout(temporizador);
      EVENTOS.forEach((evento) => document.removeEventListener(evento, reiniciar, { capture: true }));
    };
  }, [mutate, router, queryClient]);

  return null;
}
