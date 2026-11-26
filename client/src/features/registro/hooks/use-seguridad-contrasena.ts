"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import {
  analizarContrasena,
  type SeguridadDeContrasena,
} from "../servicios/seguridad-contrasena";

/**
 * Analiza la contraseña mientras se escribe, considerando los demás datos del
 * formulario. Devuelve `undefined` si todavía no hay contraseña.
 */
export function useSeguridadContrasena(): SeguridadDeContrasena | undefined {
  const { control } = useFormContext<DatosRegistro>();
  const [contrasena, nombres, apellidos, correo, documento, celular, nacimiento] = useWatch({
    control,
    name: ["contrasena", "nombres", "apellidos", "correo", "numeroDocumento", "celular", "fechaNacimiento"],
  });
  const [seguridad, setSeguridad] = useState<SeguridadDeContrasena>();

  useEffect(() => {
    if (!contrasena) return;
    let vigente = true;
    void analizarContrasena(contrasena, [nombres, apellidos, correo, documento, celular, nacimiento])
      .then((resultado) => {
        if (vigente) setSeguridad(resultado);
      });
    return () => {
      vigente = false;
    };
  }, [contrasena, nombres, apellidos, correo, documento, celular, nacimiento]);

  return contrasena ? seguridad : undefined;
}
