"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import type { TipoDeCancha } from "../servicios/tarifas";
import { filtrarMonto } from "../utilidades/filtrar-monto";

const filtrarHoras = (valor: string) => valor.replace(/\D/g, "").slice(0, 2);

const OPCIONES_DEL_SOBRANTE = [
  { valor: false, texto: "No ofrecer ese rato" },
  { valor: true, texto: "Ofrecerlo como turno corto, cobrado en proporción (desde 30 min)" },
];

/** Qué hacer con el rato final del día que no alcanza para un turno completo. */
function OpcionDelSobrante({ tipo }: { tipo: TipoDeCancha }) {
  const { control } = useFormContext<DatosDeTarifa>();
  return (
    <Controller
      control={control}
      name="ofreceTurnoCorto"
      render={({ field }) => (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-tinta">Si al final del día no alcanza para un turno completo</legend>
          {OPCIONES_DEL_SOBRANTE.map(({ valor, texto }) => (
            <label key={texto} className="flex items-start gap-2 text-sm text-tinta">
              <input type="radio" name={`${tipo}-sobrante`} checked={field.value === valor} onChange={() => field.onChange(valor)} className="mt-0.5 size-4 accent-botella" />
              {texto}
            </label>
          ))}
        </fieldset>
      )}
    />
  );
}

/** Precio de día, precio de noche, duración del turno y qué hacer con el rato sobrante. */
export function CamposDeTarifa({ tipo }: { tipo: TipoDeCancha }) {
  return (
    <>
      <p className="text-sm text-grava">Precio final de un turno completo, en soles y con IGV incluido. El turno es lo que se reserva y se cobra.</p>
      <div className="grid grid-cols-2 gap-4">
        <CampoDeTexto nombre="precioDia" id={`${tipo}-precioDia`} etiqueta="Precio de día" inputMode="decimal" ayuda="Antes de la hora de noche." filtrarEntrada={filtrarMonto} className="tabular-nums" />
        <CampoDeTexto nombre="precioNoche" id={`${tipo}-precioNoche`} etiqueta="Precio de noche" inputMode="decimal" ayuda="Desde la hora de noche." filtrarEntrada={filtrarMonto} className="tabular-nums" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CampoDeTexto nombre="duracionDelTurno" id={`${tipo}-duracionDelTurno`} etiqueta="Duración del turno" inputMode="numeric" ayuda="Horas enteras, de 1 a 12." filtrarEntrada={filtrarHoras} />
      </div>
      <OpcionDelSobrante tipo={tipo} />
    </>
  );
}
