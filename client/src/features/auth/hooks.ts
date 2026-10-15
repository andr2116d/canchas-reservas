"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cerrarSesion, iniciarSesion, obtenerSesion } from "./api";
import { RUTA_PANEL } from "./roles";

export const CLAVE_SESION = ["sesion"];

export function useSesion() {
  return useQuery({ queryKey: CLAVE_SESION, queryFn: obtenerSesion });
}

export function useIniciarSesion() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: iniciarSesion,
    onSuccess: async (usuario) => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_SESION });
      router.replace(RUTA_PANEL[usuario.rol]);
    },
  });
}

export function useCerrarSesion(destino = "/login") {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: cerrarSesion,
    onSuccess: () => {
      router.replace(destino);
      queryClient.clear();
    },
  });
}
