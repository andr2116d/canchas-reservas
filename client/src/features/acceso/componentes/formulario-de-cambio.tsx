"use client";

import { useCambioDeContrasena } from "../hooks/use-cambio-de-contrasena";
import { useOmitirCambio } from "../hooks/use-omitir-cambio";
import { BotonDeAcceso } from "./boton-de-acceso";
import { CampoDeAcceso } from "./campo-de-acceso";
import { ErrorGeneral } from "@/compartido/formulario/error-general";

/**
 * Pide una contraseña nueva y su confirmación. También deja el cambio para
 * después: se vuelve a pedir en cada inicio de sesión.
 */
export function FormularioDeCambio({ panel }: { panel: string }) {
  const { enviar, enviando, error } = useCambioDeContrasena();
  const omision = useOmitirCambio(panel);
  const mensajeDeError = error ?? omision.error;

  return (
    <form onSubmit={enviar} className="grid gap-5">
      <p id="requisitos" className="text-sm text-grava">Usa al menos 8 caracteres y un número.</p>
      <CampoDeAcceso id="contrasena" name="contrasena" etiqueta="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={64} aria-describedby="requisitos" />
      <CampoDeAcceso id="confirmacion" name="confirmacion" etiqueta="Confirma la contraseña" type="password" autoComplete="new-password" maxLength={64} />
      <ErrorGeneral mensaje={mensajeDeError} />
      <BotonDeAcceso enviando={enviando} texto="Cambiar contraseña" textoAlEnviar="Guardando contraseña…" />
      <div className="grid gap-1 text-center">
        <button
          type="button"
          onClick={omision.omitir}
          disabled={omision.omitiendo || enviando}
          className="min-h-11 rounded-lg px-3 font-bold text-botella underline underline-offset-4 hover:bg-tiza focus-visible:outline-2 focus-visible:outline-botella disabled:opacity-60"
        >
          {omision.omitiendo ? "Abriendo tu panel…" : "Ahora no"}
        </button>
        <p className="text-sm text-grava">Puedes cambiarla después, pero te lo volveremos a pedir cada vez que entres.</p>
      </div>
    </form>
  );
}
