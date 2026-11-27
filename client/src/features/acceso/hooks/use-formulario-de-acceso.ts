"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { destinoDeSesion } from "@/compartido/sesion/destino-de-sesion";
import { destinoConTurno, turnoDeLaDireccion } from "@/compartido/sesion/turno-elegido";
import { iniciarSesion } from "../servicios/acceso.api";
import { guardarCorreoRecordado, obtenerCorreoRecordado } from "../servicios/correo-recordado";

/** Envía las credenciales, recuerda el correo si se elige y vuelve al turno elegido, si lo hay. */
export function useFormularioDeAcceso() {
  const router = useRouter();
  const campoCorreo = useRef<HTMLInputElement>(null);
  const campoRecordar = useRef<HTMLInputElement>(null);
  const bloqueado = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const recordado = obtenerCorreoRecordado();
    if (!recordado || !campoCorreo.current || !campoRecordar.current) return;
    if (!campoCorreo.current.value) campoCorreo.current.value = recordado;
    campoRecordar.current.checked = true;
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueado.current) return;
    const datos = new FormData(evento.currentTarget);
    const correo = String(datos.get("correo")).trim();
    const contrasena = String(datos.get("contrasena"));
    bloqueado.current = true;
    setEnviando(true);
    setError(undefined);
    const resultado = await iniciarSesion({ correo, contrasena });
    if (resultado.tipo === "autenticado") {
      guardarCorreoRecordado(datos.has("recordar") ? correo : undefined);
      // Solo navegar: un refresh recargaría el acceso y competiría con la navegación al panel.
      router.replace(destinoConTurno(destinoDeSesion(resultado), turnoDeLaDireccion()));
      return;
    }
    setError(resultado.mensaje);
    setEnviando(false);
    bloqueado.current = false;
  }

  return { enviar, campoCorreo, campoRecordar, enviando, error };
}
