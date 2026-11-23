"use client";

import { FormProvider } from "react-hook-form";
import { DIAS_DE_LA_SEMANA, type HorarioConsultado } from "@/compartido/horario/horario";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { type AvisoDeGuardado, useHorario } from "../hooks/use-horario";
import { CampoDeHora } from "./campo-de-hora";
import { FilaDelDia } from "./fila-del-dia";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardado: "Horario guardado. Los turnos ya salen con este horario.",
  "sin-cambios": "No había cambios: el horario sigue igual.",
};

function Vigencia({ consultado }: { consultado: HorarioConsultado }) {
  const { vigente } = consultado;
  if (!vigente) {
    return <p className="text-sm font-semibold text-error">Todavía no hay horario guardado: no se ofrecen turnos.</p>;
  }
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={vigente.guardadoEn}>{fechaEnLima(vigente.guardadoEn)}</time> · por {vigente.guardadoPor}
    </p>
  );
}

/** Horario de atención de la semana y la hora en que empieza la noche. */
export function FormularioDeHorario({ consultado }: { consultado: HorarioConsultado }) {
  const { formulario, enviar, aviso, errorGeneral } = useHorario(consultado);
  const { isSubmitting } = formulario.formState;

  return (
    <section aria-labelledby="horario-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="horario-titulo" className="font-titular text-3xl font-black text-tinta">Horario de atención</h2>
        <Vigencia consultado={consultado} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2 rounded-xl bg-tiza p-4">
            <CampoDeHora nombre="inicioDeLaNoche" id="noche-general" etiqueta="La noche empieza a las" atajos={["17:00", "18:00", "19:00"]} />
            <p className="max-w-sm text-sm text-grava">Desde esta hora rige el precio de noche. Cada día puede tener la suya.</p>
          </div>
          <div>
            {DIAS_DE_LA_SEMANA.map((dia, indice) => (
              <FilaDelDia key={dia} indice={indice} />
            ))}
          </div>
          {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
              {isSubmitting ? "Guardando…" : "Guardar horario"}
            </button>
            {aviso && <p role="status" className="text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
    </section>
  );
}
