"use client";

import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { DIAS_DE_LA_SEMANA, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";
import { CampoDeHora } from "./campo-de-hora";
import { CHIP, ENLACE } from "./dias-que-abre";

/** Elige a qué día abierto darle un horario propio; empieza con el horario general. */
function ElegirDia({ libres, alElegir, alCancelar }: { libres: readonly string[]; alElegir: (dia: (typeof DIAS_DE_LA_SEMANA)[number]) => void; alCancelar: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-grava">
      <span className="mr-1">¿Qué día?</span>
      {DIAS_DE_LA_SEMANA.filter((dia) => libres.includes(dia)).map((dia) => (
        <button key={dia} type="button" onClick={() => alElegir(dia)} className={CHIP}>{NOMBRE_DEL_DIA[dia].slice(0, 3)}</button>
      ))}
      <button type="button" onClick={alCancelar} className={`${ENLACE} ml-2`}>Cancelar</button>
    </div>
  );
}

/**
 * Días que abren a otra hora que el resto. Por defecto no hay ninguno: la opción
 * aparece solo al pedirla, para no llenar la pantalla.
 */
export function DiasDistintos() {
  const { control, getValues } = useFormContext<DatosDelFormularioDeHorario>();
  const { fields, append, remove } = useFieldArray({ control, name: "distintos" });
  const abiertos = useWatch({ control, name: "abiertos" });
  const [eligiendo, setEligiendo] = useState(false);
  const distintosAbiertos = fields.map((campo, indice) => ({ campo, indice })).filter(({ campo }) => abiertos.includes(campo.dia));
  const libres = abiertos.filter((dia) => !fields.some((campo) => campo.dia === dia));

  return (
    <div className="flex flex-col gap-2.5">
      {distintosAbiertos.map(({ campo, indice }) => (
        <div key={campo.id} role="group" aria-label={NOMBRE_DEL_DIA[campo.dia]} className="flex w-fit max-w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-tiza px-4 py-3">
          <strong className="w-24 font-titular text-xl font-black text-tinta">{NOMBRE_DEL_DIA[campo.dia]}</strong>
          <CampoDeHora nombre={`distintos.${indice}.abre`} id={`${campo.dia}-abre`} etiqueta="Abre" chico />
          <CampoDeHora nombre={`distintos.${indice}.cierra`} id={`${campo.dia}-cierra`} etiqueta="Cierra" hastaMedianoche chico />
          <CampoDeHora nombre={`distintos.${indice}.inicioDeLaNoche`} id={`${campo.dia}-noche`} etiqueta="Noche desde" chico />
          <button type="button" onClick={() => remove(indice)} className={ENLACE}>Igual que los demás</button>
        </div>
      ))}
      {libres.length > 0 &&
        (eligiendo ? (
          <ElegirDia
            libres={libres}
            alElegir={(dia) => {
              const { abre, cierra, inicioDeLaNoche } = getValues();
              append({ dia, abre, cierra, inicioDeLaNoche });
              setEligiendo(false);
            }}
            alCancelar={() => setEligiendo(false)}
          />
        ) : (
          <button type="button" onClick={() => setEligiendo(true)} className={`${ENLACE} w-fit`}>
            {distintosAbiertos.length > 0 ? "Otro día distinto" : "¿Algún día abre a otra hora?"}
          </button>
        ))}
    </div>
  );
}
