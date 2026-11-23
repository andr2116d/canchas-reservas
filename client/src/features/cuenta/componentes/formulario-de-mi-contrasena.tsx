"use client";

import { FormProvider } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { useMiContrasena } from "../hooks/use-mi-contrasena";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

/** Cambio de contraseña desde la cuenta: pide la actual y la nueva dos veces. */
export function FormularioDeMiContrasena() {
  const { formulario, enviar, cambiada, errorGeneral } = useMiContrasena();
  const { isSubmitting } = formulario.formState;

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
        <CampoDeTexto nombre="actual" etiqueta="Contraseña actual" type="password" autoComplete="current-password" maxLength={LARGOS.contrasenaMaxima} />
        <CampoDeTexto
          nombre="contrasena"
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          ayuda="Al menos 8 caracteres y un número."
          maxLength={LARGOS.contrasenaMaxima}
        />
        <CampoDeTexto nombre="confirmacion" etiqueta="Confirma la contraseña nueva" type="password" autoComplete="new-password" maxLength={LARGOS.contrasenaMaxima} />
        {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
        {cambiada && (
          <p role="status" className="rounded-lg bg-tiza px-4 py-3 text-sm font-semibold text-botella">
            Contraseña cambiada. Cerramos tus otras sesiones abiertas.
          </p>
        )}
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${BOTON_PRINCIPAL} self-start`}>
          <TextoDeEnvio enviando={isSubmitting} texto="Cambiar contraseña" textoAlEnviar="Cambiando…" />
        </button>
      </form>
    </FormProvider>
  );
}
