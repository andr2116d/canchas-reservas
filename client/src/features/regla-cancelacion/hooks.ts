import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarRegla, obtenerRegla } from "./api";

const CLAVE_REGLA = ["regla-cancelacion"];
const CLAVE_RESUMEN_RESERVA = ["reserva-resumen"];

export function useReglaCancelacion() {
  return useQuery({ queryKey: CLAVE_REGLA, queryFn: obtenerRegla });
}

export function useActualizarRegla() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: actualizarRegla,
    onSettled: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: CLAVE_REGLA }),
        cliente.invalidateQueries({ queryKey: CLAVE_RESUMEN_RESERVA }),
      ]),
  });
}
