"use client";

import { useState } from "react";
import { CampoDeTexto } from "./campo-de-texto";

/** Contraseña nueva con un botón para mostrarla mientras se escribe. */
export function CampoContrasena() {
  const [visible, setVisible] = useState(false);
  const accion = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <CampoDeTexto
      nombre="contrasena"
      etiqueta="Contraseña"
      type={visible ? "text" : "password"}
      autoComplete="new-password"
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
  );
}
