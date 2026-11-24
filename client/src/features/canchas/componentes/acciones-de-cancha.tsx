"use client";

import { useState } from "react";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { useAccionDeCancha } from "../hooks/use-accion-de-cancha";
import { desactivarCancha, eliminarCancha, reactivarCancha } from "../servicios/canchas.api";
import type { Cancha } from "../servicios/canchas";
import { ReservasAfectadas } from "./reservas-afectadas";

type Confirmacion = "desactivar" | "eliminar";

const CONFIRMACIONES = {
  desactivar: {
    texto: "Dejará de aparecer para reservar hasta que la reactives. Solo se puede si no tiene reservas por jugar.",
    boton: "Sí, desactivar",
    enviando: "Desactivando…",
    clase: "bg-[#fbf1d9]",
  },
  eliminar: {
    texto: "Nunca tuvo reservas, así que se puede eliminar. El historial conserva su nombre.",
    boton: "Sí, eliminar",
    enviando: "Eliminando…",
    clase: "bg-error-fondo",
  },
} as const;

const ENLACE = "min-h-11 px-1 text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-botella";

interface AccionesDeCanchaProps {
  cancha: Cancha;
  alEditar: () => void;
}

/** Editar, desactivar o reactivar, y eliminar si nunca tuvo reservas; lo que no se deshace pide confirmar. */
export function AccionesDeCancha({ cancha, alEditar }: AccionesDeCanchaProps) {
  const [confirmando, setConfirmando] = useState<Confirmacion>();
  const { estado, ejecutar, reiniciar } = useAccionDeCancha();
  const alternar = (confirmacion: Confirmacion) => {
    reiniciar();
    setConfirmando(confirmando === confirmacion ? undefined : confirmacion);
  };
  const confirmar = async () => {
    const hecho = confirmando === "eliminar"
      ? await ejecutar(() => eliminarCancha(cancha.id), `${cancha.nombre} se eliminó.`)
      : await ejecutar(() => desactivarCancha(cancha.id), `${cancha.nombre} quedó desactivada.`);
    if (hecho) setConfirmando(undefined);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3">
        <button type="button" onClick={alEditar} className={`${ENLACE} text-botella`}>Editar</button>
        {cancha.estado === "OPERATIVA" ? (
          <button type="button" aria-expanded={confirmando === "desactivar"} onClick={() => alternar("desactivar")} className={`${ENLACE} text-grava`}>Desactivar</button>
        ) : (
          <button type="button" onClick={() => ejecutar(() => reactivarCancha(cancha.id), `${cancha.nombre} vuelve a estar operativa.`)} className={`${ENLACE} text-botella`}>Reactivar</button>
        )}
        {cancha.sePuedeEliminar && (
          <button type="button" aria-expanded={confirmando === "eliminar"} onClick={() => alternar("eliminar")} className={`${ENLACE} text-error`}>Eliminar</button>
        )}
      </div>
      {confirmando && estado.tipo !== "bloqueada" && (
        <div className={`confirmacion-de-cancha flex flex-col gap-2 rounded-xl p-3 text-sm ${CONFIRMACIONES[confirmando].clase}`}>
          <p>{CONFIRMACIONES[confirmando].texto}</p>
          <button type="button" onClick={confirmar} disabled={estado.tipo === "enviando"} className={`${BOTON_PRINCIPAL} w-fit ${confirmando === "eliminar" ? "bg-error hover:bg-error" : ""}`}>
            <TextoDeEnvio enviando={estado.tipo === "enviando"} texto={CONFIRMACIONES[confirmando].boton} textoAlEnviar={CONFIRMACIONES[confirmando].enviando} />
          </button>
        </div>
      )}
      {estado.tipo === "bloqueada" && <ReservasAfectadas mensaje={estado.mensaje} reservas={estado.reservas} />}
      {estado.tipo === "error" && <p role="alert" className="text-sm font-medium text-error">{estado.mensaje}</p>}
    </div>
  );
}
