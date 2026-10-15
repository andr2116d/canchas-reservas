"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registrarJugador, type DatosRegistro } from "./api";

export function useRegistro() {
  const router = useRouter();
  return useMutation({
    mutationFn: (datos: DatosRegistro) => registrarJugador(datos),
    onSuccess: () => router.replace("/login?registro=ok"),
  });
}