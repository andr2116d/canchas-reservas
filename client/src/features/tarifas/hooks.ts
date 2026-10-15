import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { definirTarifa, listarCanchas, obtenerTarifas, type DatosTarifa } from "./api";

const CLAVE_CANCHAS = ["canchas"];
const claveTarifas = (canchaId: number | undefined) => ["tarifas", canchaId];

export function useCanchas() {
  return useQuery({ queryKey: CLAVE_CANCHAS, queryFn: listarCanchas });
}

export function useTarifas(canchaId: number | undefined) {
  return useQuery({
    queryKey: claveTarifas(canchaId),
    queryFn: () => obtenerTarifas(canchaId as number),
    enabled: canchaId !== undefined,
  });
}

export function useDefinirTarifa(canchaId: number) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosTarifa) => definirTarifa(canchaId, datos),
    onSettled: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: claveTarifas(canchaId) }),
        cliente.invalidateQueries({ queryKey: CLAVE_CANCHAS }),
      ]),
  });
}
