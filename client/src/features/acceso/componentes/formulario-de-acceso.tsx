"use client";

import { useFormularioDeAcceso } from "../hooks/use-formulario-de-acceso";
import { guardarCorreoRecordado } from "../servicios/correo-recordado";
import { BotonDeAcceso } from "./boton-de-acceso";
import { CampoDeAcceso } from "./campo-de-acceso";

/** Permite iniciar sesión con correo y contraseña. */
export function FormularioDeAcceso() {
  const { enviar, campoCorreo, campoRecordar, enviando, error } = useFormularioDeAcceso();

  return (
    <form onSubmit={enviar} className="grid gap-4 sm:gap-5">
      <CampoDeAcceso id="correo" name="correo" etiqueta="Correo" type="email" autoComplete="username" maxLength={254} ref={campoCorreo} />
      <CampoDeAcceso id="contrasena" name="contrasena" etiqueta="Contraseña" type="password" autoComplete="current-password" maxLength={64} />
      <div>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm font-bold">
          <input ref={campoRecordar} type="checkbox" name="recordar" aria-describedby="detalle-recordar" className="size-5 accent-botella" onChange={(evento) => {
            if (!evento.currentTarget.checked) guardarCorreoRecordado();
          }} />
          Recordarme
        </label>
        <p id="detalle-recordar" className="text-sm text-grava">Recuerda tu correo en este dispositivo.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{error}</p>}
      <BotonDeAcceso enviando={enviando} texto="Iniciar sesión" textoAlEnviar="Iniciando sesión…" />
    </form>
  );
}
