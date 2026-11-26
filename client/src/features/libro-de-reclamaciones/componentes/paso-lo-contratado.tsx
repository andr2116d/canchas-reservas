"use client";

import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { filtrarMonto } from "@/compartido/formulario/filtrar-monto";
import { OpcionesSegmentadas } from "@/compartido/formulario/opciones-segmentadas";
import { NOMBRE_DEL_SERVICIO, type Servicio } from "../servicios/libro";

const SERVICIOS = (Object.keys(NOMBRE_DEL_SERVICIO) as Servicio[]).map((valor) => ({ valor, texto: NOMBRE_DEL_SERVICIO[valor] }));

/** Paso 2: el servicio sobre el que se reclama. El monto y la descripción son opcionales. */
export function PasoLoContratado() {
  return (
    <div className="flex flex-col gap-4">
      <OpcionesSegmentadas nombre="servicio" leyenda="¿Sobre qué es?" opciones={SERVICIOS} />
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <CampoDeTexto nombre="montoReclamado" etiqueta="Monto reclamado" prefijo="S/" inputMode="decimal" opcional filtrarEntrada={filtrarMonto} />
        <CampoDeTexto nombre="descripcionDelServicio" etiqueta="Descripción" opcional maxLength={200} ayuda="Por ejemplo: turno del sábado 21, 20:30, Cancha 3." />
      </div>
    </div>
  );
}
