"use client";

import { EmptyState, Spinner } from "@/components/ui";
import { useHorario } from "../hooks";
import { FormularioHorario } from "./formulario-horario";
import { VistaPreviaTurnos } from "./vista-previa-turnos";

export function PantallaHorario() {
  const { data: horario, isPending, isError, error } = useHorario();

  if (isPending) {
    return (
      <div className="flex justify-center py-12 text-texto-suave">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (isError || !horario) {
    return <EmptyState mensaje={error?.message ?? "No se pudo cargar el horario"} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Horario</h1>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <FormularioHorario horario={horario} />
        <VistaPreviaTurnos />
      </div>
    </div>
  );
}