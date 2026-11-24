"use client";

import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { filtrarMonto } from "@/compartido/formulario/filtrar-monto";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { LARGO_MAXIMO_DE_LA_DESCRIPCION, LARGO_MAXIMO_DEL_NOMBRE } from "../esquemas/adicional.schema";
import { useFormularioDeAdicional } from "../hooks/use-formulario-de-adicional";
import type { ResultadoDelGuardado } from "../servicios/adicionales.api";
import type { Adicional, DatosDeAdicional } from "../servicios/adicionales";

interface FormularioDeAdicionalProps {
  /** Prefijo de los ids, para que el alta y la edición convivan en la pantalla. */
  id: string;
  /** Nombre accesible del formulario. */
  nombre: string;
  inicial: DatosDeAdicional;
  enviar: (datos: DatosDeAdicional) => Promise<ResultadoDelGuardado>;
  alGuardar: (adicional: Adicional) => void;
  boton: { texto: string; enviando: string };
  ayudaDelPrecio: string;
  limpiarAlGuardar?: boolean;
  /** Lleva el foco al precio al aparecer, cuando el nombre ya viene escrito. */
  enfocarPrecio?: boolean;
}

/** Nombre y precio por unidad en una fila, la descripción opcional debajo y el botón. */
export function FormularioDeAdicional({ id, nombre, boton, ayudaDelPrecio, enfocarPrecio, ...opciones }: FormularioDeAdicionalProps) {
  const { formulario, alEnviar, errorGeneral } = useFormularioDeAdicional(opciones);
  const { isSubmitting } = formulario.formState;
  useEffect(() => {
    if (enfocarPrecio) formulario.setFocus("precio");
  }, [enfocarPrecio, formulario]);

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={alEnviar} aria-label={nombre} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
          <CampoDeTexto nombre="nombre" id={`${id}-nombre`} etiqueta="Nombre" maxLength={LARGO_MAXIMO_DEL_NOMBRE} autoComplete="off" />
          <CampoDeTexto nombre="precio" id={`${id}-precio`} etiqueta="Precio por unidad" prefijo="S/" inputMode="decimal" autoComplete="off" filtrarEntrada={filtrarMonto} className="font-semibold tabular-nums" />
        </div>
        <p className="-mt-2 text-xs text-grava">{ayudaDelPrecio}</p>
        <CampoDeTexto nombre="descripcion" id={`${id}-descripcion`} etiqueta="Descripción" opcional maxLength={LARGO_MAXIMO_DE_LA_DESCRIPCION} autoComplete="off" placeholder="Talla, color o marca, para reconocerlo" />
        {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${BOTON_PRINCIPAL} w-fit`}>
          <TextoDeEnvio enviando={isSubmitting} texto={boton.texto} textoAlEnviar={boton.enviando} />
        </button>
      </form>
    </FormProvider>
  );
}
