import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambiarActivaCancha,
  crearCancha,
  editarCancha,
  eliminarCancha,
  listarCanchas,
  type DatosCrearCancha,
  type DatosEditarCancha,
} from "./api";

const CLAVE = ["canchas"];

export function useCanchas() {
  return useQuery({ queryKey: CLAVE, queryFn: listarCanchas });
}

function useInvalidarCanchas() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: CLAVE });
}

export function useCrearCancha() {
  const invalidar = useInvalidarCanchas();
  return useMutation({
    mutationFn: (datos: DatosCrearCancha) => crearCancha(datos),
    onSuccess: invalidar,
  });
}

export function useEditarCancha() {
  const invalidar = useInvalidarCanchas();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: DatosEditarCancha }) => editarCancha(id, datos),
    onSuccess: invalidar,
  });
}

export function useCambiarActivaCancha() {
  const invalidar = useInvalidarCanchas();
  return useMutation({
    mutationFn: ({ id, activa, confirmar }: { id: number; activa: boolean; confirmar?: boolean }) =>
      cambiarActivaCancha(id, activa, confirmar),
    onSuccess: invalidar,
  });
}

export function useEliminarCancha() {
  const invalidar = useInvalidarCanchas();
  return useMutation({
    mutationFn: (id: number) => eliminarCancha(id),
    onSuccess: invalidar,
  });
}
