"use client";

import { useCambioDeContrasena } from "../hooks/use-cambio-de-contrasena";
import { BotonDeAcceso } from "./boton-de-acceso";
import { CampoDeAcceso } from "./campo-de-acceso";

/** Pide una contraseña nueva y su confirmación para completar el primer acceso. */
export function FormularioDeCambio() {
  const { enviar, enviando, error } = useCambioDeContrasena();

  return (
    <form onSubmit={enviar} className="grid gap-5">
      <p id="requisitos" className="text-sm text-grava">Usa al menos 8 caracteres y un número.</p>
      <CampoDeAcceso id="contrasena" name="contrasena" etiqueta="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={64} aria-describedby="requisitos" />
      <CampoDeAcceso id="confirmacion" name="confirmacion" etiqueta="Confirma la contraseña" type="password" autoComplete="new-password" maxLength={64} />
      {error && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{error}</p>}
      <BotonDeAcceso enviando={enviando} texto="Cambiar contraseña" textoAlEnviar="Guardando contraseña…" />
    </form>
  );
}
