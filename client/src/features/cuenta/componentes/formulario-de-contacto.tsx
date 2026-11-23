"use client";

import { FormProvider } from "react-hook-form";
import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { filtrarCelular, filtrarDorsal } from "@/compartido/formulario/filtros-de-entrada";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { useContacto } from "../hooks/use-contacto";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

/** Datos de contacto que la persona puede cambiar de su propia cuenta. */
export function FormularioDeContacto({ cuenta }: { cuenta: Cuenta }) {
  const { formulario, enviar, guardado, errorGeneral } = useContacto(cuenta);
  const { isSubmitting } = formulario.formState;
  const editable = (dato: Cuenta["editables"][number]) => cuenta.editables.includes(dato);

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
        {editable("correo") && (
          <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" autoComplete="email" spellCheck={false} maxLength={LARGOS.correo} />
        )}
        {editable("celular") && (
          <CampoDeTexto nombre="celular" etiqueta="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" filtrarEntrada={filtrarCelular} />
        )}
        {editable("dorsal") && (
          <CampoDeTexto nombre="dorsal" etiqueta="Dorsal" opcional inputMode="numeric" ayuda="Del 1 al 99." filtrarEntrada={filtrarDorsal} />
        )}
        {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
            <TextoDeEnvio enviando={isSubmitting} texto="Guardar cambios" textoAlEnviar="Guardando…" />
          </button>
          {guardado && <p role="status" className="font-semibold text-botella">Cambios guardados.</p>}
        </div>
      </form>
    </FormProvider>
  );
}
