"use client";

import { useFormContext } from "react-hook-form";
import { CampoDeAreaDeTexto } from "@/compartido/formulario/campo-de-area-de-texto";
import { OpcionesSegmentadas } from "@/compartido/formulario/opciones-segmentadas";
import { LARGOS_DE_LA_HOJA } from "../esquemas/hoja.schema";
import { Casilla } from "./casilla";

const TIPOS = [
  { valor: "RECLAMO", titulo: "Reclamo", definicion: "No estás conforme con el servicio: la cancha, el turno o un cobro." },
  { valor: "QUEJA", titulo: "Queja", definicion: "Te molestó la atención o algo que no es el servicio en sí." },
];

const MEDIOS = [
  { valor: "CORREO", texto: "Por correo" },
  { valor: "CARTA", texto: "Carta a mi domicilio" },
];

/** Reclamo o queja con su definición (DS 011-2011-PCM, art. 3), a un toque. */
function EleccionDelTipo() {
  const { register, formState } = useFormContext();
  const mensaje = formState.errors.tipo?.message;
  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={mensaje ? "tipo-error" : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-tinta">
        ¿Es un reclamo o una queja?<span aria-hidden="true" className="ml-0.5 text-error">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {TIPOS.map(({ valor, titulo, definicion }) => (
          <label key={valor} className="flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-linea bg-papel p-3.5 transition-colors has-checked:border-botella has-checked:bg-[#f1f7e6] has-focus-visible:outline-2 has-focus-visible:outline-botella">
            <span className="flex items-center gap-2 font-titular text-xl leading-none font-black text-cancha">
              <input type="radio" value={valor} className="size-4 accent-botella" {...register("tipo")} />
              {titulo}
            </span>
            <span className="text-sm text-grava">{definicion}</span>
          </label>
        ))}
      </div>
      <p id="tipo-error" aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {typeof mensaje === "string" ? mensaje : undefined}
      </p>
    </fieldset>
  );
}

/** Paso 3: qué pasó, qué pides y cómo quieres la respuesta. La confirmación reemplaza la firma. */
export function PasoTuReclamo() {
  return (
    <div className="flex flex-col gap-4">
      <EleccionDelTipo />
      <CampoDeAreaDeTexto nombre="detalle" etiqueta="¿Qué pasó?" maximo={LARGOS_DE_LA_HOJA.detalle} ayuda="Cuándo, dónde y con quién, si lo sabes." />
      <CampoDeAreaDeTexto nombre="pedido" etiqueta="¿Qué pides?" maximo={LARGOS_DE_LA_HOJA.pedido} filas={2} />
      <OpcionesSegmentadas nombre="medioDeRespuesta" leyenda="¿Cómo quieres la respuesta?" opciones={MEDIOS} />
      <Casilla nombre="conforme" obligatoria>
        Confirmo que mis datos son correctos. Esta confirmación reemplaza mi firma.
      </Casilla>
    </div>
  );
}
