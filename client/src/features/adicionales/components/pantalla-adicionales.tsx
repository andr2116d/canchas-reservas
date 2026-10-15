"use client";

import { useState } from "react";
import { Button, EmptyState, Spinner, useToast } from "@/components/ui";
import type { Adicional, FiltroAdicional } from "../api";
import {
  useAdicionales,
  useCambiarActivoAdicional,
  useCrearAdicional,
  useEditarAdicional,
  useEliminarAdicional,
} from "../hooks";
import { ConfirmarDesactivar } from "./confirmar-desactivar";
import { ConfirmarEliminar } from "./confirmar-eliminar";
import { FiltroActivo } from "./filtro-activo";
import { FormularioAdicional } from "./formulario-adicional";
import { TablaAdicionales } from "./tabla-adicionales";

type Dialogo =
  | { tipo: "crear" }
  | { tipo: "editar"; adicional: Adicional }
  | { tipo: "desactivar"; adicional: Adicional }
  | { tipo: "eliminar"; adicional: Adicional }
  | null;

const VACIO: Record<string, string> = {
  todos: "Todavía no hay adicionales",
  activos: "No hay adicionales activos",
  inactivos: "No hay adicionales inactivos",
};

export function PantallaAdicionales() {
  const toast = useToast();
  const [filtro, setFiltro] = useState<FiltroAdicional>();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const { data: adicionales, isPending, isError, error } = useAdicionales(filtro);
  const crear = useCrearAdicional();
  const editar = useEditarAdicional();
  const cambiarActivo = useCambiarActivoAdicional();
  const eliminar = useEliminarAdicional();

  const cerrar = () => setDialogo(null);

  const desactivar = (adicional: Adicional) =>
    cambiarActivo.mutate(
      { id: adicional.id, activo: false },
      {
        onSuccess: () => {
          cerrar();
          toast.exito("Adicional desactivado");
        },
        onError: (e) => {
          cerrar();
          toast.error(e.message);
        },
      },
    );

  const activar = (adicional: Adicional) =>
    cambiarActivo.mutate(
      { id: adicional.id, activo: true },
      {
        onSuccess: () => toast.exito("Adicional activado"),
        onError: (e) => toast.error(e.message),
      },
    );

  const confirmarEliminar = (adicional: Adicional) =>
    eliminar.mutate(adicional.id, {
      onSuccess: () => {
        cerrar();
        toast.exito("Adicional eliminado");
      },
      onError: (e) => {
        cerrar();
        toast.error(e.message);
      },
    });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Adicionales</h1>
        <Button onClick={() => setDialogo({ tipo: "crear" })}>Nuevo adicional</Button>
      </header>

      <FiltroActivo valor={filtro} onCambiar={setFiltro} />

      {isPending ? (
        <div className="flex justify-center py-12 text-texto-suave">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <EmptyState mensaje={error.message} />
      ) : adicionales.length === 0 ? (
        <EmptyState
          mensaje={VACIO[filtro ?? "todos"]}
          accion={
            filtro ? undefined : (
              <Button onClick={() => setDialogo({ tipo: "crear" })}>Nuevo adicional</Button>
            )
          }
        />
      ) : (
        <TablaAdicionales
          adicionales={adicionales}
          activandoId={
            cambiarActivo.isPending && cambiarActivo.variables.activo ? cambiarActivo.variables.id : undefined
          }
          onEditar={(adicional) => setDialogo({ tipo: "editar", adicional })}
          onDesactivar={(adicional) => setDialogo({ tipo: "desactivar", adicional })}
          onActivar={activar}
          onEliminar={(adicional) => setDialogo({ tipo: "eliminar", adicional })}
        />
      )}

      {dialogo?.tipo === "crear" && (
        <FormularioAdicional
          abierto
          onCerrar={cerrar}
          onEnviar={async ({ nombre, precio }) => {
            await crear.mutateAsync({ nombre, precio });
            cerrar();
            toast.exito("Adicional creado");
          }}
        />
      )}
      {dialogo?.tipo === "editar" && (
        <FormularioAdicional
          key={dialogo.adicional.id}
          adicional={dialogo.adicional}
          abierto
          onCerrar={cerrar}
          onEnviar={async (datos) => {
            await editar.mutateAsync({ id: dialogo.adicional.id, datos });
            cerrar();
            toast.exito("Cambios guardados");
          }}
        />
      )}
      {dialogo?.tipo === "desactivar" && (
        <ConfirmarDesactivar
          adicional={dialogo.adicional}
          abierto
          enviando={cambiarActivo.isPending}
          onCerrar={cerrar}
          onConfirmar={() => desactivar(dialogo.adicional)}
        />
      )}
      {dialogo?.tipo === "eliminar" && (
        <ConfirmarEliminar
          adicional={dialogo.adicional}
          abierto
          enviando={eliminar.isPending}
          onCerrar={cerrar}
          onConfirmar={() => confirmarEliminar(dialogo.adicional)}
        />
      )}
    </div>
  );
}