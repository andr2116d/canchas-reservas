import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listarAccesos, listarCambios, type FiltrosAccesos, type FiltrosCambios } from "./api";

const CLAVE = ["actividad"];

export function useCambios(filtros: FiltrosCambios) {
  return useQuery({
    queryKey: [...CLAVE, "cambios", filtros],
    queryFn: () => listarCambios(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useAccesos(filtros: FiltrosAccesos) {
  return useQuery({
    queryKey: [...CLAVE, "accesos", filtros],
    queryFn: () => listarAccesos(filtros),
    placeholderData: keepPreviousData,
  });
}
