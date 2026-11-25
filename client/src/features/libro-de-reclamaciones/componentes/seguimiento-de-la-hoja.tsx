"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import type { Seguimiento } from "../servicios/libro";
import { seguirHoja } from "../servicios/libro.api";
import { EstadoDeLaHoja } from "./estado-de-la-hoja";

const esquema = z.object({
  numero: z.string().trim().regex(/^\d{1,6}-\d{4}$/, "Escribe el número como aparece en tu constancia, por ejemplo 000014-2026."),
  codigo: z.string().transform((v) => v.toUpperCase().replace(/[\s-]/g, "")).pipe(z.string().regex(/^[A-Z2-9]{8}$/, "El código tiene 8 letras y números, por ejemplo K7QP-4ZMD.")),
});
type DatosDelSeguimiento = z.input<typeof esquema>;

/** Seguimiento sin cuenta: el número y el código de la constancia muestran el estado de la hoja. */
export function SeguimientoDeLaHoja() {
  const formulario = useForm<DatosDelSeguimiento>({ resolver: zodResolver(esquema), defaultValues: { numero: "", codigo: "" } });
  const [hoja, setHoja] = useState<Seguimiento>();
  const [error, setError] = useState<string>();

  async function alSeguir({ numero, codigo }: DatosDelSeguimiento) {
    setError(undefined);
    const respuesta = await seguirHoja(numero.trim(), codigo);
    if (respuesta.tipo === "aceptado") return setHoja(respuesta.cuerpo);
    setHoja(undefined);
    const resultado = resultadoDeAccion(respuesta);
    if (resultado.tipo === "datos-rechazados") marcarErroresDelServer(formulario, resultado.errores);
    else if (resultado.tipo === "error") setError(resultado.mensaje);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <FormProvider {...formulario}>
        <form noValidate onSubmit={(evento) => formulario.handleSubmit(alSeguir)(evento)} className="flex flex-col gap-4" aria-label="Buscar mi hoja">
          <CampoDeTexto nombre="numero" etiqueta="Número de hoja" inputMode="numeric" autoComplete="off" placeholder="000014-2026" />
          <CampoDeTexto nombre="codigo" etiqueta="Código de seguimiento" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="K7QP-4ZMD" />
          <ErrorGeneral mensaje={error} />
          <button type="submit" disabled={formulario.formState.isSubmitting} className={BOTON_PRINCIPAL}>
            <TextoDeEnvio enviando={formulario.formState.isSubmitting} texto="Ver mi hoja" textoAlEnviar="Buscando…" />
          </button>
          <p className="text-sm text-grava">Los dos datos están en tu constancia y en el correo que te enviamos.</p>
        </form>
      </FormProvider>
      <section aria-live="polite" aria-label="Estado de la hoja">
        {hoja ? <EstadoDeLaHoja hoja={hoja} /> : <p className="rounded-xl border border-dashed border-linea px-5 py-8 text-center text-sm text-grava">Aquí verás el estado de tu hoja.</p>}
      </section>
    </div>
  );
}
