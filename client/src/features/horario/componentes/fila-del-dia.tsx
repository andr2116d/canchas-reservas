"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";
import { CampoDeHora } from "./campo-de-hora";
import { InterruptorDeApertura } from "./interruptor-de-apertura";

const ACCION_DISCRETA =
  "rounded-lg px-2 py-1 text-sm font-semibold text-botella underline-offset-4 hover:underline " +
  "focus-visible:outline-2 focus-visible:outline-botella";

/** Copia la apertura y el cierre del día a los demás días abiertos. */
function useCopiarALosDemas(indice: number) {
  const { getValues, setValue } = useFormContext<DatosDelFormularioDeHorario>();
  return () => {
    const { abre, cierra } = getValues(`dias.${indice}`);
    getValues("dias").forEach((dia, otro) => {
      if (otro === indice || !dia.abierto) return;
      setValue(`dias.${otro}.abre`, abre, { shouldDirty: true });
      setValue(`dias.${otro}.cierra`, cierra, { shouldDirty: true, shouldValidate: true });
    });
  };
}

/** Un día de la semana: si abre, a qué hora abre y cierra, y si tiene su propia hora de noche. */
export function FilaDelDia({ indice }: { indice: number }) {
  const { register, control } = useFormContext<DatosDelFormularioDeHorario>();
  const dia = useWatch({ control, name: `dias.${indice}` });
  const nocheGeneral = useWatch({ control, name: "inicioDeLaNoche" });
  const copiarALosDemas = useCopiarALosDemas(indice);
  const nombre = NOMBRE_DEL_DIA[dia.dia];
  const id = (campo: string) => `${dia.dia}-${campo}`;

  return (
    <div role="group" aria-labelledby={id("nombre")} className="grid gap-4 border-t border-linea py-5 first:border-t-0 md:grid-cols-[9rem_1fr] md:items-start">
      <div className="flex items-center justify-between gap-3 md:flex-col md:items-start">
        <h3 id={id("nombre")} className="font-titular text-2xl font-black text-tinta">{nombre}</h3>
        <InterruptorDeApertura indice={indice} nombre={nombre} />
      </div>
      {dia.abierto ? (
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          <CampoDeHora nombre={`dias.${indice}.abre`} id={id("abre")} etiqueta="Abre" />
          <CampoDeHora nombre={`dias.${indice}.cierra`} id={id("cierra")} etiqueta="Cierra" hastaMedianoche />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-tinta">
              <input type="checkbox" className="size-4 accent-botella" {...register(`dias.${indice}.nochePropia`)} />
              Otra hora de noche este día
            </label>
            {dia.nochePropia ? (
              <CampoDeHora nombre={`dias.${indice}.inicioDeLaNoche`} id={id("noche")} etiqueta="Noche" />
            ) : (
              <p className="text-sm text-grava">La noche empieza a las {nocheGeneral}.</p>
            )}
          </div>
          <button type="button" onClick={copiarALosDemas} className={`${ACCION_DISCRETA} self-end`}>
            Copiar a los demás días abiertos
          </button>
        </div>
      ) : (
        <p className="self-center text-grava">Cerrado: este día no se ofrecen turnos.</p>
      )}
    </div>
  );
}
