"use client";

import { useFormContext } from "react-hook-form";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";

/**
 * Interruptor para abrir o cerrar un día completo. Sale del server ya marcado
 * para que no se anime al cargar la página.
 */
export function InterruptorDeApertura({ indice, nombre }: { indice: number; nombre: string }) {
  const { register, getValues } = useFormContext<DatosDelFormularioDeHorario>();
  return (
    <label className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-grava has-checked:text-botella">
      <input type="checkbox" role="switch" aria-label={`Abre el ${nombre.toLowerCase()}`} className="peer sr-only" defaultChecked={getValues(`dias.${indice}.abierto`)} {...register(`dias.${indice}.abierto`)} />
      <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-linea transition-colors peer-checked:bg-botella peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-botella after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-papel after:shadow after:transition-transform peer-checked:after:translate-x-5" />
      <span aria-hidden="true" className="w-14">
        <span className="group-has-checked:hidden">Cerrado</span>
        <span className="hidden group-has-checked:inline">Abierto</span>
      </span>
    </label>
  );
}
