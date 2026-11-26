"use client";

import { useFormContext } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { generarContrasenaTemporal } from "../utilidades/generar-contrasena-temporal";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";

/** Contraseña temporal a la vista, para dictarla o copiarla; se escribe o se genera. */
export function CampoDeContrasenaTemporal() {
  const { setValue } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <CampoDeTexto
        nombre="contrasena"
        etiqueta="Contraseña temporal"
        ayuda="Entrégasela en persona. Al entrar, se le pedirá cambiarla."
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        maxLength={LARGOS.contrasenaMaxima}
        className="font-mono tracking-wide"
      />
      <button
        type="button"
        onClick={() => setValue("contrasena", generarContrasenaTemporal(), { shouldDirty: true, shouldValidate: true })}
        className={`${BOTON_SECUNDARIO} self-start`}
      >
        Generar contraseña
      </button>
    </div>
  );
}
