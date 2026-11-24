"use client";

import type { FormEvent } from "react";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { useFormularioDeBloqueo } from "../hooks/use-formulario-de-bloqueo";
import type { TipoDeBloqueo } from "../servicios/bloqueos";
import { partesEnLima } from "../utilidades/rango-en-lima";
import { CamposDelRango, RepeticionDelBloqueo, SelectorDeCanchas } from "./campos-del-bloqueo";
import { ChoqueDelBloqueo, ReservasAfectadasPorBloqueo } from "./choque-del-bloqueo";
import { Segmento } from "./controles-de-cancha";

const TIPOS: { valor: TipoDeBloqueo; texto: string }[] = [
  { valor: "PROGRAMADO", texto: "Programado" },
  { valor: "EMERGENCIA", texto: "Emergencia" },
];

const AYUDA_DEL_TIPO: Record<TipoDeBloqueo, string> = {
  PROGRAMADO: "Si choca con reservas, no se guarda hasta reubicarlas.",
  EMERGENCIA: "Empieza ahora y se guarda aunque haya reservas.",
};

const textoDelBoton = (cuantas: number) => (cuantas === 0 ? "Bloquear" : `Bloquear ${cuantas} cancha${cuantas > 1 ? "s" : ""}`);

interface FormularioDeBloqueoProps {
  canchas: { id: number; nombre: string }[];
  /** Instante de la petición, para proponer el rango y mostrar la hora de «ahora». */
  ahora: string;
}

/** Bloquear canchas por mantenimiento: canchas, tipo, rango, repetición opcional y motivo. */
export function FormularioDeBloqueo({ canchas, ahora }: FormularioDeBloqueoProps) {
  const { borrador, cambiar, errores, choque, afectadas, enviando, enviar } = useFormularioDeBloqueo(ahora);
  const alEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    void enviar();
  };
  const emergencia = borrador.tipo === "EMERGENCIA";
  return (
    <form noValidate onSubmit={alEnviar} aria-labelledby="titulo-del-bloqueo" className={`${TARJETA} flex flex-col gap-4`}>
      <div>
        <h2 id="titulo-del-bloqueo" className="font-titular text-2xl leading-none font-black text-tinta">Bloquear canchas</h2>
        <p className="mt-1 text-sm text-grava">No se reservan en ese rango y vuelven solas al terminar.</p>
      </div>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <SelectorDeCanchas canchas={canchas} elegidas={borrador.canchaIds} alCambiar={(canchaIds) => cambiar({ canchaIds })} error={errores.canchaIds} />
        <Segmento etiqueta="Tipo" opciones={TIPOS} valor={borrador.tipo} alElegir={(tipo) => cambiar({ tipo })} ayuda={AYUDA_DEL_TIPO[borrador.tipo]} error={errores.tipo} />
      </div>
      <CamposDelRango borrador={borrador} cambiar={cambiar} errores={errores} horaActual={partesEnLima(new Date(ahora)).hora} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="motivo-del-bloqueo" className="text-sm font-semibold text-tinta">
          Motivo<span aria-hidden="true" className="ml-0.5 text-error">*</span>
          <span className="ml-2 text-xs font-normal text-grava">solo lo ve el personal</span>
        </label>
        <input id="motivo-del-bloqueo" value={borrador.motivo} maxLength={200} autoComplete="off" aria-invalid={Boolean(errores.motivo)} onChange={(e) => cambiar({ motivo: e.target.value })} className="campo-de-cancha w-full" />
        <p aria-live="polite" className="text-sm font-medium text-error empty:hidden">{errores.motivo}</p>
      </div>
      <RepeticionDelBloqueo borrador={borrador} cambiar={cambiar} error={errores.repeticion} />
      {choque && <ChoqueDelBloqueo choque={choque} />}
      <ReservasAfectadasPorBloqueo reservas={afectadas} />
      {errores.general && <p role="alert" className="text-sm font-medium text-error">{errores.general}</p>}
      <button type="submit" disabled={enviando} className={`${BOTON_PRINCIPAL} w-fit ${emergencia ? "bg-error hover:bg-error" : ""}`}>
        <TextoDeEnvio enviando={enviando} texto={textoDelBoton(borrador.canchaIds.length)} textoAlEnviar="Bloqueando…" />
      </button>
    </form>
  );
}
