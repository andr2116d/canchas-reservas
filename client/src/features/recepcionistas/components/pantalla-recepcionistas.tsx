"use client";

import { useState } from "react";
import { Button, EmptyState, Spinner, useToast } from "@/components/ui";
import type { EstadoUsuario, Recepcionista } from "../api";
import {
  useCambiarEstadoRecepcionista,
  useCrearRecepcionista,
  useEditarRecepcionista,
  useRecepcionistas,
  useRestablecerContrasena,
} from "../hooks";
import { ConfirmarDesactivar } from "./confirmar-desactivar";
import { FiltroEstado } from "./filtro-estado";
import { FormularioCrearRecepcionista, FormularioEditarRecepcionista } from "./formulario-recepcionista";
import { RestablecerContrasena } from "./restablecer-contrasena";
import { TablaRecepcionistas } from "./tabla-recepcionistas";

type Dialogo =
  | { tipo: "crear" }
  | { tipo: "editar" | "desactivar" | "restablecer"; recepcionista: Recepcionista }
  | null;

const VACIO: Record<string, string> = {
  todos: "Aún no hay recepcionistas registrados",
  ACTIVO: "No hay recepcionistas activos",
  INACTIVO: "No hay recepcionistas inactivos",
};

export function PantallaRecepcionistas() {
  const toast = useToast();
  const [estado, setEstado] = useState<EstadoUsuario>();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const { data: recepcionistas, isPending, isError, error } = useRecepcionistas(estado);
  const crear = useCrearRecepcionista();
  const editar = useEditarRecepcionista();
  const cambiarEstado = useCambiarEstadoRecepcionista();
  const restablecer = useRestablecerContrasena();

  const cerrar = () => setDialogo(null);

  const desactivar = (recepcionista: Recepcionista) =>
    cambiarEstado.mutate(
      { id: recepcionista.id, estado: "INACTIVO" },
      {
        onSuccess: () => toast.exito("Recepcionista desactivado"),
        onError: (e) => toast.error(e.message),
        onSettled: cerrar,
      },
    );

  const activar = (recepcionista: Recepcionista) =>
    cambiarEstado.mutate(
      { id: recepcionista.id, estado: "ACTIVO" },
      {
        onSuccess: () => toast.exito("Recepcionista activado"),
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Recepcionistas</h1>
        <Button onClick={() => setDialogo({ tipo: "crear" })}>Nuevo recepcionista</Button>
      </header>

      <FiltroEstado valor={estado} onCambiar={setEstado} />

      {isPending ? (
        <div className="flex justify-center py-12 text-texto-suave">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <EmptyState mensaje={error.message} />
      ) : recepcionistas.length === 0 ? (
        <EmptyState mensaje={VACIO[estado ?? "todos"]} />
      ) : (
        <TablaRecepcionistas
          recepcionistas={recepcionistas}
          activandoId={
            cambiarEstado.isPending && cambiarEstado.variables.estado === "ACTIVO"
              ? cambiarEstado.variables.id
              : undefined
          }
          onEditar={(recepcionista) => setDialogo({ tipo: "editar", recepcionista })}
          onDesactivar={(recepcionista) => setDialogo({ tipo: "desactivar", recepcionista })}
          onActivar={activar}
          onRestablecer={(recepcionista) => setDialogo({ tipo: "restablecer", recepcionista })}
        />
      )}

      {dialogo?.tipo === "crear" && (
        <FormularioCrearRecepcionista
          abierto
          onCerrar={cerrar}
          onEnviar={async (datos) => {
            await crear.mutateAsync(datos);
            cerrar();
            toast.exito("Recepcionista creado");
          }}
        />
      )}
      {dialogo?.tipo === "editar" && (
        <FormularioEditarRecepcionista
          key={dialogo.recepcionista.id}
          recepcionista={dialogo.recepcionista}
          abierto
          onCerrar={cerrar}
          onEnviar={async (datos) => {
            await editar.mutateAsync({ id: dialogo.recepcionista.id, datos });
            cerrar();
            toast.exito("Cambios guardados");
          }}
        />
      )}
      {dialogo?.tipo === "desactivar" && (
        <ConfirmarDesactivar
          recepcionista={dialogo.recepcionista}
          abierto
          enviando={cambiarEstado.isPending}
          onCerrar={cerrar}
          onConfirmar={() => desactivar(dialogo.recepcionista)}
        />
      )}
      {dialogo?.tipo === "restablecer" && (
        <RestablecerContrasena
          key={dialogo.recepcionista.id}
          recepcionista={dialogo.recepcionista}
          abierto
          onCerrar={cerrar}
          onEnviar={async (contrasena) => {
            await restablecer.mutateAsync({ id: dialogo.recepcionista.id, contrasena });
            cerrar();
            toast.exito("Contraseña restablecida");
          }}
        />
      )}
    </div>
  );
}
