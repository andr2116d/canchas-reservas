"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { destinoDeSesion, RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { cambiarContrasenaTemporal } from "../servicios/acceso.api";

/** Cambia la contraseña temporal y abre el panel correspondiente. */
export function useCambioDeContrasena() {
  const router = useRouter();
  const bloqueado = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueado.current) return;
    const campos = new FormData(evento.currentTarget);
    const contrasena = String(campos.get("contrasena"));
    if (contrasena !== campos.get("confirmacion")) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
    bloqueado.current = true;
    setEnviando(true);
    setError(undefined);
    const resultado = await cambiarContrasenaTemporal(contrasena);
    if (resultado.tipo === "autenticado") {
      router.replace(destinoDeSesion(resultado));
      return;
    }
    if (resultado.sesionVencida) {
      router.replace(RUTA_DE_ACCESO + "?motivo=inactividad");
      return;
    }
    setError(resultado.mensaje);
    setEnviando(false);
    bloqueado.current = false;
  }

  return { enviar, enviando, error };
}
