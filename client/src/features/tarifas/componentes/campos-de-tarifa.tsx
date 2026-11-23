"use client";

import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import type { TipoDeCancha } from "../servicios/tarifas";
import { filtrarMonto } from "../utilidades/filtrar-monto";

const filtrarHoras = (valor: string) => valor.replace(/\D/g, "").slice(0, 2);

/** Precio de día, precio de noche y duración del turno de un tipo de cancha. */
export function CamposDeTarifa({ tipo, inicioDeLaNoche }: { tipo: TipoDeCancha; inicioDeLaNoche: string }) {
  return (
    <>
      <p className="text-sm text-grava">Precio final de un turno completo, en soles y con IGV incluido.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="precioDia" id={`${tipo}-precioDia`} etiqueta="Precio de día" inputMode="decimal" placeholder="50.00" ayuda={`Antes de las ${inicioDeLaNoche}.`} filtrarEntrada={filtrarMonto} className="tabular-nums" />
        <CampoDeTexto nombre="precioNoche" id={`${tipo}-precioNoche`} etiqueta="Precio de noche" inputMode="decimal" placeholder="70.00" ayuda={`Desde las ${inicioDeLaNoche}.`} filtrarEntrada={filtrarMonto} className="tabular-nums" />
      </div>
      <CampoDeTexto nombre="duracionDelTurno" id={`${tipo}-duracionDelTurno`} etiqueta="Duración del turno" inputMode="numeric" ayuda="En horas enteras, de 1 a 12. Es lo que se reserva y se cobra." filtrarEntrada={filtrarHoras} />
    </>
  );
}
