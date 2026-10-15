import { useQuery } from "@tanstack/react-query";
import { obtenerDisponibilidad } from "./api";

export function useDisponibilidad(fecha: string) {
  return useQuery({
    queryKey: ["disponibilidad", fecha],
    queryFn: () => obtenerDisponibilidad(fecha),
    enabled: Boolean(fecha),
  });
}
