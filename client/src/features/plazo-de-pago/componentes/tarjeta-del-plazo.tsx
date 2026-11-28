"use client";

import { FormProvider, useWatch } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { type AvisoDeGuardado, useFormularioDeVersion } from "@/compartido/formulario/use-formulario-de-version";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { VersionesAnteriores } from "@/compartido/ui/versiones-anteriores";
import { esquemaDelPlazo, filtrarMinutos } from "../esquemas/plazo-de-pago.schema";
import { guardarPlazo } from "../servicios/plazo-de-pago.api";
import type { PlazoConsultado } from "../servicios/plazo-de-pago";
import { duracionLegible } from "../utilidades/duracion-legible";

const AVISOS: Record<AvisoDeGuardado, string> = {
  guardado: "Plazo guardado. Rige para las reservas nuevas; las ya separadas vencen a su hora.",
  "sin-cambios": "No había cambios: el plazo sigue igual.",
};

function Vigencia({ consultado }: { consultado: PlazoConsultado }) {
  const { vigente, porDefecto } = consultado;
  if (!vigente) return <p className="text-sm text-grava">Rige el plazo por defecto: {porDefecto} minutos.</p>;
  return (
    <p className="text-sm text-grava">
      Vigente desde <time dateTime={vigente.guardadaEn}>{fechaEnLima(vigente.guardadaEn)}</time> · por {vigente.guardadaPor}
    </p>
  );
}

/** Lo que significan los minutos escritos, en horas si pasan de una. */
function Ejemplo() {
  const minutos = useWatch<{ minutos: string }, "minutos">({ name: "minutos" });
  if (!esquemaDelPlazo.safeParse({ minutos }).success) return null;
  return <p className="w-fit rounded-xl bg-tiza px-3.5 py-2.5 text-sm text-tinta">{`Un turno separado queda guardado ${duracionLegible(Number(minutos))}, o hasta que empiece si es antes.`}</p>;
}

/** Cuánto tiempo hay para pagar el adelanto antes de que el turno se libere solo. */
export function TarjetaDelPlazo({ consultado }: { consultado: PlazoConsultado }) {
  const { formulario, enviar, aviso, errorGeneral } = useFormularioDeVersion({
    esquema: esquemaDelPlazo,
    valoresIniciales: { minutos: String(consultado.vigente?.minutos ?? consultado.porDefecto) },
    guardar: guardarPlazo,
  });
  const { isSubmitting } = formulario.formState;

  return (
    <section aria-labelledby="plazo-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="plazo-titulo" className="font-titular text-3xl font-black text-tinta">Plazo para pagar el adelanto</h2>
        <p className="max-w-[62ch] text-sm text-grava">Si no se paga a tiempo, el turno se libera solo y la reserva pasa a vencida.</p>
        <Vigencia consultado={consultado} />
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <div className="w-52">
            <CampoDeTexto nombre="minutos" id="plazo-minutos" etiqueta="Minutos para pagar" ayuda="Entero de 1 a 1440 (24 h)." inputMode="numeric" filtrarEntrada={filtrarMinutos} accesorio={<span className="pr-3.5 font-semibold text-grava">min</span>} className="font-semibold tabular-nums" />
          </div>
          <Ejemplo />
          <ErrorGeneral mensaje={errorGeneral} />
          <div className="flex flex-col items-start gap-2">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
              <TextoDeEnvio enviando={isSubmitting} texto="Guardar plazo" textoAlEnviar="Guardando…" />
            </button>
            {aviso && <p role="status" className="text-sm font-semibold text-botella">{AVISOS[aviso]}</p>}
          </div>
        </form>
      </FormProvider>
      <VersionesAnteriores titulo="Plazos" versiones={consultado.historial.slice(1)} resumen={(version) => `${version.minutos} min`} />
    </section>
  );
}
