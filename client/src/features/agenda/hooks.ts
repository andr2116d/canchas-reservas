import { useQuery } from "@tanstack/react-query";
import { obtenerAgenda } from "./api";

export function useAgenda(
  fecha: string,
  canchaId?: string,
  estado?: string,
) {
  return useQuery({
    queryKey: ["agenda", fecha, canchaId ?? "todas", estado ?? "todos"],
    queryFn: () => obtenerAgenda(fecha, canchaId, estado),
    enabled: Boolean(fecha),
  });
}
