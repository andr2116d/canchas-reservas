"use client";

import { FormProvider } from "react-hook-form";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { type AvisoDeGuardado, useHorario } from "../hooks/use-horario";
import { CampoDeHora } from "./campo-de-hora";
import { DiasDistintos } from "./dias-distintos";
import { DiasQueAbre } from "./dias-que-abre";
import { ReservasFueraDeHorario } from "./reservas-fuera-de-horario";
import { SemanaResumida } from "./semana-resumida";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { ErrorGeneral } from "@/compartido/formulario/error-general";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardado: "Horario guardado. Rige para las reservas nuevas; las reservas ya hechas no cambian.",
  "sin-cambios": "No había cambios: el horario sigue igual.",
};

function Vigencia({ consultado: { vigente } }: { consultado: HorarioConsultado }) {
  if (!vigente) return <p className="text-sm font-semibold text-error">Todavía no hay horario guardado: no se ofrecen turnos.</p>;
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={vigente.guardadoEn}>{fechaEnLima(vigente.guardadoEn)}</time> · por {vigente.guardadoPor}
    </p>
  );
}

/** Horario de atención: un horario para los días que abre y, si hace falta, días que abren a otra hora. */
export function FormularioDeHorario({ consultado }: { consultado: HorarioConsultado }) {
  const { formulario, enviar, aviso, errorGeneral, reservasFuera, confirmando, guardarIgual, revisar } = useHorario(consultado);
  const { isSubmitting } = formulario.formState;

  return (
    <section aria-labelledby="horario-titulo" className={`${TARJETA} flex flex-col gap-6`}>
      <header className="flex flex-col gap-1">
        <h2 id="horario-titulo" className="font-titular text-3xl font-black text-tinta">Horario de atención</h2>
        <p className="max-w-[60ch] text-sm text-grava">Los turnos empiezan a la hora de apertura y siguen uno detrás de otro hasta el cierre.</p>
        <Vigencia consultado={consultado} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
          <DiasQueAbre />
          <div className="flex flex-col gap-4 border-t border-linea pt-5">
            <div className="flex flex-wrap gap-x-5 gap-y-4 sm:gap-x-8">
              <CampoDeHora nombre="abre" id="horario-abre" etiqueta="Abre" ayuda="Empieza el primer turno." />
              <CampoDeHora nombre="cierra" id="horario-cierra" etiqueta="Cierra" ayuda="Termina el último turno. Hasta las 24:00." hastaMedianoche />
              <CampoDeHora nombre="inicioDeLaNoche" id="horario-noche" etiqueta="Precio de noche desde" ayuda="Antes de esta hora se cobra el precio de día." />
            </div>
            <DiasDistintos />
          </div>
          <div className="border-t border-linea pt-5">
            <SemanaResumida />
          </div>
          <ErrorGeneral mensaje={errorGeneral} />
          {reservasFuera && <ReservasFueraDeHorario reservas={reservasFuera} confirmando={confirmando} alGuardarIgual={() => void guardarIgual()} alRevisar={revisar} />}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
              <TextoDeEnvio enviando={isSubmitting} texto="Guardar horario" textoAlEnviar="Guardando…" />
            </button>
            {aviso && <p role="status" className="max-w-[44ch] text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
    </section>
  );
}
