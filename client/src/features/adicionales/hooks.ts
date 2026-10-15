import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambiarActivoAdicional,
  crearAdicional,
  editarAdicional,
  eliminarAdicional,
  listarAdicionales,
  type DatosAdicional,
  type FiltroAdicional,
} from "./api";

const CLAVE = ["adicionales"];

export function useAdicionales(filtro?: FiltroAdicional) {
  return useQuery({
    queryKey: [...CLAVE, filtro ?? "todos"],
    queryFn: () => listarAdicionales(filtro),
  });
}

function useInvalidarAdicionales() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: CLAVE });
}

export function useCrearAdicional() {
  const invalidar = useInvalidarAdicionales();
  return useMutation({
    mutationFn: (datos: DatosAdicional) => crearAdicional(datos),
    onSuccess: invalidar,
  });
}

export function useEditarAdicional() {
  const invalidar = useInvalidarAdicionales();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: DatosAdicional }) => editarAdicional(id, datos),
    onSuccess: invalidar,
  });
}

export function useCambiarActivoAdicional() {
  const invalidar = useInvalidarAdicionales();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => cambiarActivoAdicional(id, activo),
    onSuccess: invalidar,
  });
}

export function useEliminarAdicional() {
  const invalidar = useInvalidarAdicionales();
  return useMutation({
    mutationFn: (id: number) => eliminarAdicional(id),
    onSuccess: invalidar,
  });
}