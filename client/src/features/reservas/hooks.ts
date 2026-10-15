import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crearReserva, obtenerMisReservas, obtenerResumenReserva } from "./api";

export function useResumenReserva(params: { canchaId?: number; fecha?: string; horaInicio?: string } | null) {
  const valido = Boolean(params?.canchaId && params?.fecha && params?.horaInicio);
  return useQuery({
    queryKey: ["reserva-resumen", params?.canchaId, params?.fecha, params?.horaInicio],
    queryFn: () =>
      obtenerResumenReserva({
        canchaId: params!.canchaId!,
        fecha: params!.fecha!,
        horaInicio: params!.horaInicio!,
      }),
    enabled: valido,
  });
}

export function useMisReservas() {
  return useQuery({
    queryKey: ["mis-reservas"],
    queryFn: obtenerMisReservas,
  });
}

export function useCrearReserva() {
  const consulta = useQueryClient();
  return useMutation({
    mutationFn: crearReserva,
    onSuccess: () => {
      consulta.invalidateQueries({ queryKey: ["reserva-resumen"] });
      consulta.invalidateQueries({ queryKey: ["mis-reservas"] });
      consulta.invalidateQueries({ queryKey: ["disponibilidad"] });
      consulta.invalidateQueries({ queryKey: ["turnos"] });
    },
  });
}