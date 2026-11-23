"use client";

import { reactivarRecepcionista, restablecerContrasena } from "../servicios/recepcionistas.api";
import { DesactivacionDeCuenta } from "./desactivacion-de-cuenta";
import { FormularioDeContrasenaTemporal } from "./formulario-de-contrasena-temporal";

interface AccionesDeCuentaProps {
  id: number;
  nombres: string;
  activa: boolean;
}

/** Acciones sobre el acceso: restablecer y desactivar si está activa; reactivar si no. */
export function AccionesDeCuenta({ id, nombres, activa }: AccionesDeCuentaProps) {
  if (!activa) {
    return (
      <section aria-labelledby="titulo-reactivar" className="flex flex-col gap-3">
        <h2 id="titulo-reactivar" className="font-titular text-2xl font-black text-tinta">Reactivar cuenta</h2>
        <p className="text-sm text-grava">Recupera sus datos y su historial con una contraseña temporal nueva.</p>
        <FormularioDeContrasenaTemporal
          textoDelBoton="Reactivar cuenta"
          textoAlEnviar="Reactivando…"
          ejecutar={(contrasena) => reactivarRecepcionista(id, contrasena)}
        />
      </section>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="titulo-restablecer" className="flex flex-col gap-3">
        <h2 id="titulo-restablecer" className="font-titular text-2xl font-black text-tinta">Restablecer contraseña</h2>
        <p className="text-sm text-grava">Sus sesiones abiertas se cerrarán y deberá cambiarla al entrar.</p>
        <FormularioDeContrasenaTemporal
          textoDelBoton="Restablecer contraseña"
          textoAlEnviar="Restableciendo…"
          ejecutar={(contrasena) => restablecerContrasena(id, contrasena)}
        />
      </section>
      <section aria-labelledby="titulo-desactivar" className="flex flex-col gap-3 border-t border-linea pt-6">
        <h2 id="titulo-desactivar" className="font-titular text-2xl font-black text-tinta">Desactivar</h2>
        <DesactivacionDeCuenta id={id} nombres={nombres} />
      </section>
    </div>
  );
}
