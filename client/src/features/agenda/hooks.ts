import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmarPago, obtenerAgenda, type DatosConfirmarPago } from "./api";

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

export function useConfirmarPago() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: DatosConfirmarPago }) => confirmarPago(id, datos),
    onSettled: () => {
      cliente.invalidateQueries({ queryKey: ["agenda"] });
      cliente.invalidateQueries({ queryKey: ["disponibilidad"] });
    },
  });
}
