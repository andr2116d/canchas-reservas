"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { campoCon, reglaDeContrasena } from "@/compartido/formulario/reglas-de-datos-personales";
import { cambiarMiContrasena } from "../servicios/cuenta.api";

const esquema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual."),
    contrasena: campoCon(reglaDeContrasena),
    confirmacion: z.string(),
  })
  .refine(({ contrasena, confirmacion }) => contrasena === confirmacion, {
    message: "Las contraseñas deben coincidir.",
    path: ["confirmacion"],
  });

type DatosDeContrasena = z.infer<typeof esquema>;

/** Cambia la contraseña con la actual; al terminar, la sesión ya está renovada. */
export function useMiContrasena() {
  const [cambiada, setCambiada] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeContrasena>({
    resolver: zodResolver(esquema),
    defaultValues: { actual: "", contrasena: "", confirmacion: "" },
  });

  const enviar = formulario.handleSubmit(async ({ actual, contrasena }) => {
    setCambiada(false);
    setErrorGeneral(undefined);
    const resultado = await cambiarMiContrasena(actual, contrasena);
    if (resultado.tipo === "hecho") {
      setCambiada(true);
      formulario.reset();
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, enviar, cambiada, errorGeneral };
}
