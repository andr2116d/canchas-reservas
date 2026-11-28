"use client";

import { FormProvider, useWatch } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { VersionesAnteriores } from "@/compartido/ui/versiones-anteriores";
import { esquemaDelAdelanto, filtrarPorcentaje } from "../esquemas/adelanto.schema";
import type { AvisoDeGuardado } from "@/compartido/formulario/use-formulario-de-version";
import { useAdelanto } from "../hooks/use-adelanto";
import type { AdelantoConsultado, VistaDelAdelanto } from "../servicios/adelanto";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardado: "Adelanto guardado. Rige para las reservas nuevas; las reservas ya hechas no cambian.",
  "sin-cambios": "No había cambios: el adelanto sigue igual.",
};

function Vigencia({ vigente }: { vigente?: VistaDelAdelanto }) {
  if (!vigente) {
    return <p className="text-sm font-semibold text-error">Todavía no hay adelanto guardado: guárdalo para que los turnos muestren cuánto se paga al separar.</p>;
  }
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={vigente.guardadaEn}>{fechaEnLima(vigente.guardadaEn)}</time> · por {vigente.guardadaPor}
    </p>
  );
}

/** Ejemplo con un turno de S/ 100, para leer el porcentaje en soles sin calcular. */
function Ejemplo() {
  const porcentaje = useWatch<{ porcentaje: string }, "porcentaje">({ name: "porcentaje" });
  if (!esquemaDelAdelanto.safeParse({ porcentaje }).success) return null;
  return <p className="w-fit rounded-xl bg-tiza px-3.5 py-2.5 text-sm text-tinta tabular-nums">{`Por cada S/ 100 del turno se pagan S/ ${Number(porcentaje)} para separarlo.`}</p>;
}

/** Porcentaje del precio del turno que se paga como mínimo para separarlo, igual para todo el local. */
export function TarjetaDelAdelanto({ consultado }: { consultado: AdelantoConsultado }) {
  const { formulario, enviar, aviso, errorGeneral } = useAdelanto(consultado);
  const { isSubmitting } = formulario.formState;

  return (
    <section aria-labelledby="adelanto-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="adelanto-titulo" className="font-titular text-3xl font-black text-tinta">Adelanto mínimo</h2>
        <p className="max-w-[62ch] text-sm text-grava">Lo mínimo que se paga para separar un turno. También se puede pagar el total; el saldo se paga en el local.</p>
        <Vigencia vigente={consultado.vigente} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <div className="w-52">
            <CampoDeTexto nombre="porcentaje" id="adelanto-porcentaje" etiqueta="Porcentaje del precio del turno" ayuda="Entero de 1 a 100." inputMode="numeric" filtrarEntrada={filtrarPorcentaje} accesorio={<span className="pr-3.5 font-semibold text-grava">%</span>} className="font-semibold tabular-nums" />
          </div>
          <Ejemplo />
          <ErrorGeneral mensaje={errorGeneral} />
          <div className="flex flex-col items-start gap-2">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
              <TextoDeEnvio enviando={isSubmitting} texto="Guardar adelanto" textoAlEnviar="Guardando…" />
            </button>
            {aviso && <p role="status" className="text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
      <VersionesAnteriores titulo="Adelantos" versiones={consultado.historial.slice(1)} resumen={(version) => `${version.porcentaje} %`} />
    </section>
  );
}
