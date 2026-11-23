"use client";

import { FormProvider } from "react-hook-form";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { type AvisoDeGuardado, useTarifa } from "../hooks/use-tarifa";
import { NOMBRE_DEL_TIPO, type TarifaDelTipo } from "../servicios/tarifas";
import { CamposDeTarifa } from "./campos-de-tarifa";
import { HistorialDeTarifa } from "./historial-de-tarifa";
import { TurnosPorDia } from "./turnos-por-dia";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardada: "Tarifa guardada. Rige para las reservas nuevas; las reservas ya hechas mantienen su precio.",
  "sin-cambios": "No había cambios: la tarifa sigue igual.",
};

function Vigencia({ tarifa }: { tarifa: TarifaDelTipo }) {
  if (!tarifa.vigente) return <p className="text-sm font-semibold text-error">Todavía no tiene tarifa: no se ofrecen sus turnos.</p>;
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={tarifa.vigente.guardadaEn}>{fechaEnLima(tarifa.vigente.guardadaEn)}</time> · por {tarifa.vigente.guardadaPor}
    </p>
  );
}

/** Tarifa de un tipo de cancha: precio del turno de día y de noche, su duración y los turnos que salen. */
export function TarjetaDeTarifa({ tarifa }: { tarifa: TarifaDelTipo }) {
  const { formulario, enviar, aviso, errorGeneral } = useTarifa(tarifa);
  const { isSubmitting } = formulario.formState;
  const nombre = NOMBRE_DEL_TIPO[tarifa.tipo];

  return (
    <section aria-labelledby={`${tarifa.tipo}-titulo`} className="flex w-full flex-col gap-5 rounded-2xl border border-linea bg-papel p-5 sm:w-[22rem]">
      <header className="flex flex-col gap-0.5">
        <h3 id={`${tarifa.tipo}-titulo`} className="font-titular text-2xl font-black text-tinta">{nombre}</h3>
        <Vigencia tarifa={tarifa} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
          <CamposDeTarifa tipo={tarifa.tipo} />
          <TurnosPorDia tipo={tarifa.tipo} />
          {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
          <div className="flex flex-col items-start gap-2">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} aria-label={`Guardar tarifa de ${nombre.toLowerCase()}`} className={BOTON_PRINCIPAL}>
              <TextoDeEnvio enviando={isSubmitting} texto="Guardar tarifa" textoAlEnviar="Guardando…" />
            </button>
            {aviso && <p role="status" className="text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
      <HistorialDeTarifa anteriores={tarifa.historial.slice(1)} />
    </section>
  );
}
