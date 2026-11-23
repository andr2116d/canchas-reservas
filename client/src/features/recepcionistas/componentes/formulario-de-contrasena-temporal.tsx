"use client";

import { FormProvider } from "react-hook-form";
import { useContrasenaTemporalEntregada } from "../hooks/use-contrasena-temporal-entregada";
import type { ResultadoDeAccion } from "../servicios/recepcionistas.api";
import { CampoDeContrasenaTemporal } from "./campo-de-contrasena-temporal";
import { BOTON_PRINCIPAL } from "./estilos";

interface FormularioDeContrasenaTemporalProps {
  textoDelBoton: string;
  textoAlEnviar: string;
  ejecutar: (contrasena: string) => Promise<ResultadoDeAccion>;
}

/** Pide una contraseña temporal nueva y, al aplicarla, la muestra para entregarla. */
export function FormularioDeContrasenaTemporal({ textoDelBoton, textoAlEnviar, ejecutar }: FormularioDeContrasenaTemporalProps) {
  const { formulario, enviar, entregable, errorGeneral } = useContrasenaTemporalEntregada(ejecutar);
  const { isSubmitting } = formulario.formState;

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <CampoDeContrasenaTemporal />
        {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
        {entregable && (
          <p role="status" className="rounded-lg bg-tiza px-4 py-3 text-sm text-tinta">
            Entrégale la nueva contraseña temporal:{" "}
            <strong className="font-mono text-base tracking-wide">{entregable}</strong>
          </p>
        )}
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${BOTON_PRINCIPAL} self-start`}>
          {isSubmitting ? textoAlEnviar : textoDelBoton}
        </button>
      </form>
    </FormProvider>
  );
}
