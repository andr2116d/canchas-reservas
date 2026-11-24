"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { esquemaDeAdicional } from "../esquemas/adicional.schema";
import type { ResultadoDelGuardado } from "../servicios/adicionales.api";
import type { Adicional, DatosDeAdicional } from "../servicios/adicionales";

export const SIN_DATOS: DatosDeAdicional = { nombre: "", descripcion: "", precio: "" };

interface OpcionesDelFormulario {
  inicial: DatosDeAdicional;
  enviar: (datos: DatosDeAdicional) => Promise<ResultadoDelGuardado>;
  alGuardar: (adicional: Adicional) => void;
  /** Deja el formulario vacío al guardar, para agregar otro. */
  limpiarAlGuardar?: boolean;
}

/** Valida el formato, envía y marca junto a cada campo lo que responda el server. */
export function useFormularioDeAdicional({ inicial, enviar, alGuardar, limpiarAlGuardar = false }: OpcionesDelFormulario) {
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeAdicional>({
    resolver: zodResolver(esquemaDeAdicional),
    mode: "onTouched",
    defaultValues: inicial,
  });

  const alEnviar = formulario.handleSubmit(async ({ nombre, descripcion, precio }) => {
    setErrorGeneral(undefined);
    const resultado = await enviar({ nombre: nombre.trim(), descripcion: descripcion.trim(), precio: precio.trim() });
    if (resultado.tipo === "guardado") {
      if (limpiarAlGuardar) formulario.reset(SIN_DATOS);
      alGuardar(resultado.adicional);
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, alEnviar, errorGeneral };
}
