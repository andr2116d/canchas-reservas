"use client";

import { FormProvider } from "react-hook-form";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { type AvisoDeGuardado, useReglaDeCancelacion } from "../hooks/use-regla-de-cancelacion";
import type { ReglaConsultada } from "../servicios/cancelacion";
import { FilaDelRango } from "./fila-del-rango";
import { LineaDeTiempo } from "./linea-de-tiempo";
import { useReglaEnEdicion } from "./proveedor-de-la-regla";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardada: "Regla guardada. Rige para las reservas nuevas; las reservas ya hechas conservan la suya.",
  "sin-cambios": "No había cambios: la regla sigue igual.",
};
const MAXIMO_DE_RANGOS = 10;

function Vigencia({ consultada: { vigente } }: { consultada: ReglaConsultada }) {
  if (!vigente) return <p className="text-sm font-semibold text-error">Todavía no hay regla guardada: esta es una propuesta para empezar.</p>;
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={vigente.guardadaEn}>{fechaEnLima(vigente.guardadaEn)}</time> · por {vigente.guardadaPor}
    </p>
  );
}

/** Regla de cancelación: rangos de anticipación con lo que devuelve cada uno. */
export function FormularioDeRegla({ consultada }: { consultada: ReglaConsultada }) {
  const { formulario, rangos, agregar, quitar, enviar, aviso, errorGeneral } = useReglaDeCancelacion(consultada);
  const { aviso: reglaDeFondo } = useReglaEnEdicion();
  const { isSubmitting, errors } = formulario.formState;
  const alerta = errorGeneral ?? errors.rangos?.message ?? errors.rangos?.root?.message ?? reglaDeFondo;

  return (
    <section aria-labelledby="regla-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="regla-titulo" className="font-titular text-3xl font-black text-tinta">Regla de cancelación</h2>
        <p className="max-w-[60ch] text-sm text-grava">
          Cuánto del anticipo se devuelve según con cuánta anticipación se cancela. Lo pagado por encima del anticipo se devuelve siempre.
        </p>
        <Vigencia consultada={consultada} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
          <LineaDeTiempo />
          <ol className="flex flex-col gap-2">
            {rangos.map((rango, indice) => (
              <FilaDelRango key={rango.id} indice={indice} fijo={rango.desdeHoras === "0"} alQuitar={() => quitar(indice)} />
            ))}
          </ol>
          {rangos.length < MAXIMO_DE_RANGOS && (
            <button type="button" onClick={agregar} className="w-fit rounded-xl border border-dashed border-botella px-3.5 py-1.5 text-sm font-bold text-botella hover:bg-tiza">
              Agregar rango
            </button>
          )}
          <p className="max-w-[62ch] text-xs text-grava">Si un rango devuelve algo, el jugador siempre puede pedir su dinero; el crédito es una opción más.</p>
          {alerta && <p role="alert" className="w-fit rounded-xl bg-error-fondo px-4 py-2.5 text-sm font-semibold text-error">{alerta}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
              <TextoDeEnvio enviando={isSubmitting} texto="Guardar regla" textoAlEnviar="Guardando…" />
            </button>
            {aviso && <p role="status" className="max-w-[46ch] text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
    </section>
  );
}
