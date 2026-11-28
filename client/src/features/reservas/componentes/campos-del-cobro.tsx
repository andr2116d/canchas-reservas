"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { EtiquetaDeCampo } from "@/compartido/formulario/etiqueta-de-campo";
import { filtrarMonto } from "@/compartido/formulario/filtrar-monto";
import { METODOS_DE_COBRO, type DatosDeCobro } from "../esquemas/recepcion.schema";

export function CamposDelCobro({ ayuda }: { ayuda?: string }) {
  const { control, register, formState: { errors } } = useFormContext<DatosDeCobro>();
  const metodo = useWatch({ control, name: "metodo" });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoDeTexto nombre="monto" etiqueta="Monto" prefijo="S/" inputMode="decimal" filtrarEntrada={filtrarMonto} ayuda={ayuda} />
      <div className="flex flex-col gap-1.5">
        <EtiquetaDeCampo htmlFor="metodo">Método de pago</EtiquetaDeCampo>
        <select id="metodo" required aria-invalid={Boolean(errors.metodo)} aria-describedby={errors.metodo && "metodo-error"} className="w-full rounded-lg border border-linea bg-papel px-3.5 py-2.5 text-tinta focus-visible:outline-botella aria-invalid:border-error" {...register("metodo")}>
          <option value="">Elige un método</option>
          {Object.entries(METODOS_DE_COBRO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        {errors.metodo && <p id="metodo-error" role="alert" className="text-sm text-error">{errors.metodo.message}</p>}
      </div>
      {(metodo === "YAPE" || metodo === "PLIN") && <CampoDeTexto nombre="numeroOperacion" etiqueta="Número de operación" maxLength={120} autoComplete="off" />}
    </div>
  );
}
