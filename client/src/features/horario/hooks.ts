import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { guardarHorario, obtenerHorario, obtenerVistaPrevia, type DatosGuardarHorario } from "./api";

const CLAVE = ["horario"];
const claveVistaPrevia = (fecha: string) => ["horario", "vista-previa", fecha];

export function useHorario() {
  return useQuery({ queryKey: CLAVE, queryFn: obtenerHorario });
}

export function useGuardarHorario() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosGuardarHorario) => guardarHorario(datos),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useVistaPrevia(fecha: string) {
  return useQuery({
    queryKey: claveVistaPrevia(fecha),
    queryFn: () => obtenerVistaPrevia(fecha),
    enabled: fecha !== "",
  });
}