"use client";

import { useState } from "react";
import { Button, EmptyState, Spinner, useToast } from "@/components/ui";
import { ErrorApi } from "@/lib/api";
import { reservasDelConflicto, type Cancha, type ReservaFutura } from "../api";
import { useCambiarActivaCancha, useCanchas, useCrearCancha, useEditarCancha, useEliminarCancha } from "../hooks";
import { ConfirmarDesactivar } from "./confirmar-desactivar";
import { ConfirmarEliminar, type ConflictoEliminar } from "./confirmar-eliminar";
import { FormularioCancha } from "./formulario-cancha";
import { TablaCanchas } from "./tabla-canchas";

type Dialogo =
  | { tipo: "crear" }
  | { tipo: "editar"; cancha: Cancha }
  | { tipo: "desactivar"; cancha: Cancha; reservas?: ReservaFutura[] }
  | { tipo: "eliminar"; cancha: Cancha; conflicto?: ConflictoEliminar }
  | null;

export function PantallaCanchas() {
  const toast = useToast();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const { data: canchas, isPending, isError, error } = useCanchas();
  const crear = useCrearCancha();
  const editar = useEditarCancha();
  const cambiarActiva = useCambiarActivaCancha();
  const eliminar = useEliminarCancha();

  const cerrar = () => setDialogo(null);

  const desactivar = (cancha: Cancha, reservas?: ReservaFutura[]) =>
    cambiarActiva.mutate(
      { id: cancha.id, activa: false, confirmar: reservas?.length ? true : undefined },
      {
        onSuccess: () => {
          cerrar();
          toast.exito("Cancha desactivada");
        },
        onError: (e) => {
          const afectadas = reservasDelConflicto(e);
          if (afectadas?.length) {
            setDialogo({ tipo: "desactivar", cancha, reservas: afectadas });
            return;
          }
          cerrar();
          toast.error(e.message);
        },
      },
    );

  const activar = (cancha: Cancha) =>
    cambiarActiva.mutate(
      { id: cancha.id, activa: true },
      {
        onSuccess: () => toast.exito("Cancha activada"),
        onError: (e) => toast.error(e.message),
      },
    );

  const confirmarEliminar = (cancha: Cancha) =>
    eliminar.mutate(cancha.id, {
      onSuccess: () => {
        cerrar();
        toast.exito("Cancha eliminada");
      },
      onError: (e) => {
        if (e instanceof ErrorApi && e.status === 409) {
          setDialogo({
            tipo: "eliminar",
            cancha,
            conflicto: { motivo: e.message, reservas: reservasDelConflicto(e) ?? [] },
          });
          return;
        }
        cerrar();
        toast.error(e.message);
      },
    });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Canchas</h1>
        <Button onClick={() => setDialogo({ tipo: "crear" })}>Nueva cancha</Button>
      </header>

      {isPending ? (
        <div className="flex justify-center py-12 text-texto-suave">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <EmptyState mensaje={error.message} />
      ) : canchas.length === 0 ? (
        <EmptyState mensaje="Aún no hay canchas registradas" />
      ) : (
        <TablaCanchas
          canchas={canchas}
          activandoId={
            cambiarActiva.isPending && cambiarActiva.variables.activa ? cambiarActiva.variables.id : undefined
          }
          onEditar={(cancha) => setDialogo({ tipo: "editar", cancha })}
          onDesactivar={(cancha) => setDialogo({ tipo: "desactivar", cancha })}
          onActivar={activar}
          onEliminar={(cancha) => setDialogo({ tipo: "eliminar", cancha })}
        />
      )}

      {dialogo?.tipo === "crear" && (
        <FormularioCancha
          abierto
          onCerrar={cerrar}
          onEnviar={async ({ nombre, tamano, iluminacion }) => {
            await crear.mutateAsync({ nombre, tamano, iluminacion });
            cerrar();
            toast.exito("Cancha creada");
          }}
        />
      )}
      {dialogo?.tipo === "editar" && (
        <FormularioCancha
          key={dialogo.cancha.id}
          cancha={dialogo.cancha}
          abierto
          onCerrar={cerrar}
          onEnviar={async (datos) => {
            await editar.mutateAsync({ id: dialogo.cancha.id, datos });
            cerrar();
            toast.exito("Cambios guardados");
          }}
        />
      )}
      {dialogo?.tipo === "desactivar" && (
        <ConfirmarDesactivar
          cancha={dialogo.cancha}
          reservas={dialogo.reservas}
          abierto
          enviando={cambiarActiva.isPending}
          onCerrar={cerrar}
          onConfirmar={() => desactivar(dialogo.cancha, dialogo.reservas)}
        />
      )}
      {dialogo?.tipo === "eliminar" && (
        <ConfirmarEliminar
          cancha={dialogo.cancha}
          conflicto={dialogo.conflicto}
          abierto
          enviando={eliminar.isPending}
          onCerrar={cerrar}
          onConfirmar={() => confirmarEliminar(dialogo.cancha)}
          onDesactivar={() => {
            const reservas = dialogo.conflicto?.reservas;
            setDialogo({ tipo: "desactivar", cancha: dialogo.cancha, reservas: reservas?.length ? reservas : undefined });
          }}
        />
      )}
    </div>
  );
}
