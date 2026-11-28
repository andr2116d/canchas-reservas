"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { esquemaDeVentana, type DatosDeVentana } from "../esquemas/ventana-de-llegada.schema";
import { guardarVentanaDeLlegada } from "../servicios/ventana-de-llegada.api";
import type { LimitesDeLlegada } from "../servicios/ventana-de-llegada";

export function useVentanaDeLlegada(limites: LimitesDeLlegada) {
  const router = useRouter();
  const [aviso, setAviso] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeVentana>({ resolver: zodResolver(esquemaDeVentana), mode: "onTouched", defaultValues: { minutosAntes: String(limites.minutosAntes), minutosDespues: String(limites.minutosDespues) } });
  const enviar = formulario.handleSubmit(async ({ minutosAntes, minutosDespues }) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const respuesta = await guardarVentanaDeLlegada({ minutosAntes: Number(minutosAntes), minutosDespues: Number(minutosDespues) });
    if (respuesta.tipo === "aceptado") {
      setAviso(respuesta.cuerpo.cambio ? "Ventana guardada para las reservas nuevas." : "La ventana sigue igual.");
      router.refresh();
    } else if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length) {
      marcarErroresDelServer(formulario, respuesta.errores);
    } else setErrorGeneral(respuesta.mensaje);
  });
  return { formulario, enviar, aviso, errorGeneral };
}
