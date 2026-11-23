"use client";

import { FormProvider } from "react-hook-form";
import { useContrasenaTemporalEntregada } from "../hooks/use-contrasena-temporal-entregada";
import type { ResultadoDeAccion } from "../servicios/recepcionistas.api";
import { BotonDeCopiar } from "@/compartido/ui/boton-de-copiar";
import { datosParaEntregar } from "../utilidades/datos-para-entregar";
import { CampoDeContrasenaTemporal } from "./campo-de-contrasena-temporal";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

interface FormularioDeContrasenaTemporalProps {
  /** Correo de la recepcionista, para copiar sus datos de acceso. */
  correo: string;
  textoDelBoton: string;
  textoAlEnviar: string;
  ejecutar: (contrasena: string) => Promise<ResultadoDeAccion>;
  /** Qué hacer cuando la acción salió bien; por defecto, refrescar la página. */
  alTerminar?: () => void;
}

/** Pide una contraseña temporal nueva y, al aplicarla, la muestra para entregarla. */
export function FormularioDeContrasenaTemporal({
  correo,
  textoDelBoton,
  textoAlEnviar,
  ejecutar,
  alTerminar,
}: FormularioDeContrasenaTemporalProps) {
  const { formulario, enviar, entregable, errorGeneral } = useContrasenaTemporalEntregada(ejecutar, alTerminar);
  const { isSubmitting } = formulario.formState;

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <CampoDeContrasenaTemporal />
        {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
        {entregable && (
          <div className="flex flex-col gap-3 rounded-lg bg-tiza px-4 py-3 text-sm text-tinta">
            <p>
              Entrégale la nueva contraseña temporal:{" "}
              <strong className="font-mono text-base tracking-wide">{entregable}</strong>
            </p>
            <BotonDeCopiar
              texto={() => datosParaEntregar({ correo, contrasena: entregable, sitio: window.location.origin })}
            />
          </div>
        )}
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${BOTON_PRINCIPAL} self-start`}>
          <TextoDeEnvio enviando={isSubmitting} texto={textoDelBoton} textoAlEnviar={textoAlEnviar} />
        </button>
      </form>
    </FormProvider>
  );
}
