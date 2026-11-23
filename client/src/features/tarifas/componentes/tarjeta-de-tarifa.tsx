"use client";

import { FormProvider } from "react-hook-form";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import type { VistaDeHorario } from "@/compartido/horario/horario";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { type AvisoDeGuardado, useTarifa } from "../hooks/use-tarifa";
import { NOMBRE_DEL_TIPO, type TarifaDelTipo } from "../servicios/tarifas";
import { CamposDeTarifa } from "./campos-de-tarifa";
import { HistorialDeTarifa } from "./historial-de-tarifa";
import { ResumenSemanal } from "./resumen-semanal";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardada: "Tarifa guardada. Rige para las reservas nuevas; las ya hechas conservan su precio.",
  "sin-cambios": "No había cambios: la tarifa sigue igual.",
};

function Vigencia({ tarifa }: { tarifa: TarifaDelTipo }) {
  if (!tarifa.vigente) {
    return <p className="text-sm font-semibold text-error">Todavía no tiene tarifa: no se puede calcular su precio.</p>;
  }
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={tarifa.vigente.guardadaEn}>{fechaEnLima(tarifa.vigente.guardadaEn)}</time> · por{" "}
      {tarifa.vigente.guardadaPor}
    </p>
  );
}

/** Tarifa de un tipo de cancha: precio del turno de día y de noche, y cuánto dura el turno. */
export function TarjetaDeTarifa({ tarifa, horario }: { tarifa: TarifaDelTipo; horario?: VistaDeHorario }) {
  const { formulario, enviar, aviso, errorGeneral } = useTarifa(tarifa);
  const { isSubmitting } = formulario.formState;
  const nombre = NOMBRE_DEL_TIPO[tarifa.tipo];

  return (
    <section aria-labelledby={`${tarifa.tipo}-titulo`} className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id={`${tarifa.tipo}-titulo`} className="font-titular text-3xl font-black text-tinta">{nombre}</h2>
        <Vigencia tarifa={tarifa} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
          <CamposDeTarifa tipo={tarifa.tipo} />
          <ResumenSemanal horario={horario} idTitulo={`${tarifa.tipo}-resumen`} />
          {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} aria-label={`Guardar tarifa de ${nombre.toLowerCase()}`} className={BOTON_PRINCIPAL}>
              {isSubmitting ? "Guardando…" : "Guardar tarifa"}
            </button>
            {aviso && <p role="status" className="text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
      <HistorialDeTarifa anteriores={tarifa.historial.slice(1)} />
    </section>
  );
}
