import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambiarEstadoRecepcionista,
  crearRecepcionista,
  editarRecepcionista,
  listarRecepcionistas,
  restablecerContrasena,
  type DatosCrearRecepcionista,
  type DatosEditarRecepcionista,
  type EstadoUsuario,
} from "./api";

const CLAVE = ["recepcionistas"];

export function useRecepcionistas(estado?: EstadoUsuario) {
  return useQuery({
    queryKey: [...CLAVE, estado ?? "todos"],
    queryFn: () => listarRecepcionistas(estado),
  });
}

function useInvalidarRecepcionistas() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: CLAVE });
}

export function useCrearRecepcionista() {
  const invalidar = useInvalidarRecepcionistas();
  return useMutation({
    mutationFn: (datos: DatosCrearRecepcionista) => crearRecepcionista(datos),
    onSuccess: invalidar,
  });
}

export function useEditarRecepcionista() {
  const invalidar = useInvalidarRecepcionistas();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: DatosEditarRecepcionista }) => editarRecepcionista(id, datos),
    onSuccess: invalidar,
  });
}

export function useCambiarEstadoRecepcionista() {
  const invalidar = useInvalidarRecepcionistas();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoUsuario }) => cambiarEstadoRecepcionista(id, estado),
    onSuccess: invalidar,
  });
}

export function useRestablecerContrasena() {
  return useMutation({
    mutationFn: ({ id, contrasena }: { id: number; contrasena: string }) => restablecerContrasena(id, contrasena),
  });
}
