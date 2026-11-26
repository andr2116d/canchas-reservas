"use client";

import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { useAccionConAviso } from "@/compartido/ui/use-accion-con-aviso";
import type { SesionDeLaCuenta } from "../servicios/cuenta.servidor";
import { cerrarMisOtrasSesiones } from "../servicios/cuenta.api";

/** Desde dónde está abierta la cuenta, con la opción de cerrar todo menos esta sesión. */
export function MisSesiones({ sesiones }: { sesiones: SesionDeLaCuenta[] }) {
  const { estado, ejecutar } = useAccionConAviso();
  const otras = sesiones.filter((sesion) => !sesion.actual).length;
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Sesiones abiertas" className="flex flex-col divide-y divide-dashed divide-linea">
        {sesiones.map((sesion) => (
          <li key={sesion.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
            <span className="font-bold text-tinta">
              {sesion.dispositivo ?? "Navegador desconocido"}
              {sesion.actual && <span className="ml-2 rounded-full bg-tiza px-2 py-0.5 text-xs font-bold text-botella">Esta sesión</span>}
            </span>
            <span className="text-sm text-grava tabular-nums">
              Abierta el {fechaEnLima(sesion.abiertaEn)} · activa {fechaEnLima(sesion.ultimaActividadEn)}
            </span>
          </li>
        ))}
      </ul>
      {otras > 0 && (
        <button
          type="button"
          disabled={estado.tipo === "enviando"}
          onClick={() => ejecutar(cerrarMisOtrasSesiones, otras === 1 ? "Cerramos tu otra sesión." : `Cerramos tus otras ${otras} sesiones.`)}
          className={`${BOTON_SECUNDARIO} w-fit`}
        >
          <TextoDeEnvio enviando={estado.tipo === "enviando"} texto="Cerrar las demás" textoAlEnviar="Cerrando…" />
        </button>
      )}
      {estado.tipo === "error" && <p role="alert" className="text-sm font-medium text-error">{estado.mensaje}</p>}
    </div>
  );
}
