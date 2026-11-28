"use client";

import { FormProvider } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { VersionesAnteriores } from "@/compartido/ui/versiones-anteriores";
import { useVentanaDeLlegada } from "../hooks/use-ventana-de-llegada";
import type { VentanaConsultada } from "../servicios/ventana-de-llegada";

export function TarjetaDeVentanaDeLlegada({ consultada }: { consultada: VentanaConsultada }) {
  const { vigente, inicial, historial } = consultada;
  const { formulario, enviar, aviso, errorGeneral } = useVentanaDeLlegada(vigente ?? inicial);
  const { isSubmitting } = formulario.formState;
  return (
    <section aria-labelledby="ventana-titulo" className={`${TARJETA} flex flex-col gap-4`}>
      <header>
        <h2 id="ventana-titulo" className="font-titular text-3xl font-black text-cancha">Ventana de llegada</h2>
        <p className="text-sm text-grava">Define cuándo puede hacerse el check-in de una reserva nueva. Ingresa minutos enteros, de 0 a 120.</p>
        {vigente && <p className="mt-1 text-sm text-grava">Vigente desde <time dateTime={vigente.guardadaEn}>{fechaEnLima(vigente.guardadaEn)}</time> · por {vigente.guardadaPor}</p>}
      </header>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoDeTexto nombre="minutosAntes" etiqueta="Minutos antes del inicio" inputMode="numeric" maxLength={3} />
            <CampoDeTexto nombre="minutosDespues" etiqueta="Minutos después del inicio" inputMode="numeric" maxLength={3} />
          </div>
          <ErrorGeneral mensaje={errorGeneral} />
          <button type="submit" className={`${BOTON_PRINCIPAL} self-start`} disabled={isSubmitting}><TextoDeEnvio enviando={isSubmitting} texto="Guardar ventana de llegada" textoAlEnviar="Guardando…" /></button>
          {aviso && <p role="status" className="text-sm font-semibold text-botella">{aviso}</p>}
        </form>
      </FormProvider>
      <VersionesAnteriores titulo="Ventanas de llegada" versiones={historial.slice(1)} resumen={(version) => `${version.minutosAntes} min antes · ${version.minutosDespues} min después`} />
    </section>
  );
}
