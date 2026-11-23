"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import type { TipoDeCancha } from "../servicios/tarifas";
import { filtrarMonto } from "../utilidades/filtrar-monto";
import { SelectorDeDuracion } from "./selector-de-duracion";

const OPCIONES_DEL_SOBRANTE = [
  { valor: false, texto: "No se ofrece" },
  { valor: true, texto: "Se ofrece como turno corto y se cobra la parte que dura" },
];

/** Qué pasa con el rato final del día que no alcanza para un turno completo. */
function OpcionDelSobrante({ tipo }: { tipo: TipoDeCancha }) {
  const { control } = useFormContext<DatosDeTarifa>();
  return (
    <Controller
      control={control}
      name="ofreceTurnoCorto"
      render={({ field }) => (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-bold text-tinta">Si al final del día queda un rato más corto que un turno</legend>
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

/** Precio del turno de día y de noche, cuánto dura y qué pasa con el rato sobrante. */
export function CamposDeTarifa({ tipo }: { tipo: TipoDeCancha }) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div className="w-34">
          <CampoDeTexto nombre="precioDia" id={`${tipo}-precioDia`} etiqueta="Precio de día" prefijo="S/" inputMode="decimal" filtrarEntrada={filtrarMonto} className="font-semibold tabular-nums" />
        </div>
        <div className="w-34">
          <CampoDeTexto nombre="precioNoche" id={`${tipo}-precioNoche`} etiqueta="Precio de noche" prefijo="S/" inputMode="decimal" filtrarEntrada={filtrarMonto} className="font-semibold tabular-nums" />
        </div>
      </div>
      <SelectorDeDuracion tipo={tipo} />
      <OpcionDelSobrante tipo={tipo} />
    </>
  );
}
