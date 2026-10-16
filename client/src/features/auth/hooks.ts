"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ErrorApi } from "@/lib/api";
import { cerrarSesion, iniciarSesion, obtenerSesion } from "./api";
import { RUTA_PANEL } from "./roles";
import { avisarCierre, DESTINO_CIERRE, type MotivoCierre } from "./sesion-compartida";

export const CLAVE_SESION = ["sesion"];

export function useSesion() {
  return useQuery({ queryKey: CLAVE_SESION, queryFn: obtenerSesion });
}

export function useIniciarSesion() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: iniciarSesion,
    meta: { manejaSesion: true },
    onSuccess: async (usuario) => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_SESION });
      router.replace(RUTA_PANEL[usuario.rol]);
    },
  });
}

export function useCerrarSesion(motivo: MotivoCierre = "manual") {
  const queryClient = useQueryClient();
  const router = useRouter();
  const terminar = () => {
    router.replace(DESTINO_CIERRE[motivo]);
    queryClient.clear();
    avisarCierre(motivo);
  };
  return useMutation({
    mutationFn: cerrarSesion,
    meta: { manejaSesion: true },
    onSuccess: terminar,
    onError: (error) => {
      if (error instanceof ErrorApi && error.status === 401) terminar();
    },
  });
}
