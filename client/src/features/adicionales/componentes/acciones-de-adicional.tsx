"use client";

import { useState } from "react";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { useAccionConAviso } from "@/compartido/ui/use-accion-con-aviso";
import { desactivarAdicional, eliminarAdicional, reactivarAdicional } from "../servicios/adicionales.api";
import type { Adicional } from "../servicios/adicionales";

const ENLACE = "min-h-9 px-1 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-botella";

interface AccionesDeAdicionalProps {
  adicional: Adicional;
  alEditar: () => void;
}

/** Editar, desactivar o reactivar, y eliminar si nunca se usó; eliminar pide confirmar. */
export function AccionesDeAdicional({ adicional, alEditar }: AccionesDeAdicionalProps) {
  const [confirmando, setConfirmando] = useState(false);
  const { estado, ejecutar, reiniciar } = useAccionConAviso();
  const { id, nombre } = adicional;
  const eliminar = async () => {
    if (await ejecutar(() => eliminarAdicional(id), `${nombre} se eliminó.`)) setConfirmando(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3">
        <button type="button" onClick={alEditar} className={`${ENLACE} text-botella`}>Editar</button>
        {adicional.estado === "ACTIVO" ? (
          <button type="button" onClick={() => ejecutar(() => desactivarAdicional(id), `${nombre} quedó desactivado: no se ofrece ni se entrega.`)} className={`${ENLACE} text-grava`}>Desactivar</button>
        ) : (
          <button type="button" onClick={() => ejecutar(() => reactivarAdicional(id), `${nombre} vuelve a estar disponible.`)} className={`${ENLACE} text-botella`}>Reactivar</button>
        )}
        {adicional.sePuedeEliminar && (
          <button type="button" aria-expanded={confirmando} onClick={() => { reiniciar(); setConfirmando(!confirmando); }} className={`${ENLACE} text-error`}>Eliminar</button>
        )}
      </div>
      {confirmando && (
        <div className="confirmacion-de-adicional flex flex-wrap items-center gap-3 rounded-xl bg-error-fondo p-3 text-sm">
          <p className="min-w-0 flex-1">Nunca se usó, así que se puede eliminar. El historial conserva su nombre.</p>
          <button type="button" onClick={eliminar} disabled={estado.tipo === "enviando"} className={`${BOTON_PRINCIPAL} min-h-10 bg-error px-4 py-2 text-sm hover:bg-error`}>
            <TextoDeEnvio enviando={estado.tipo === "enviando"} texto="Sí, eliminar" textoAlEnviar="Eliminando…" />
          </button>
        </div>
      )}
      {estado.tipo === "error" && <p role="alert" className="text-sm font-medium text-error">{estado.mensaje}</p>}
    </div>
  );
}
