"use client";

import { useState } from "react";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { IndicadorDeSeguridad } from "./indicador-de-seguridad";

/** Contraseña nueva con un botón para mostrarla y un indicador de qué tan segura es. */
export function CampoContrasena() {
  const [visible, setVisible] = useState(false);
  const accion = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <div className="flex flex-col gap-3">
      <CampoDeTexto
        nombre="contrasena"
        etiqueta="Contraseña"
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        maxLength={LARGOS.contrasenaMaxima}
        ayuda="De 8 a 64 caracteres, con al menos un número."
        className="pr-24"
        accesorio={
          <button
            type="button"
            aria-label={accion}
            aria-pressed={visible}
            onClick={() => setVisible((anterior) => !anterior)}
            className="absolute inset-y-1.5 right-1.5 rounded-md px-3 text-sm font-semibold text-botella hover:bg-botella/8 focus-visible:outline-2 focus-visible:outline-botella"
          >
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        }
      />
      <IndicadorDeSeguridad />
    </div>
  );
}
