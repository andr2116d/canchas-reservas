"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import { CampoDeAreaDeTexto } from "@/compartido/formulario/campo-de-area-de-texto";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import type { HojaParaAtender } from "../servicios/reclamos";
import { responderHoja } from "../servicios/reclamos.api";

interface DatosDeLaRespuesta {
  respuesta: string;
  cartaEnviadaEl: string;
}

/** Último paso antes de enviar: la respuesta no se edita después. */
function Confirmacion({ porCarta, enviando, enviar, volver }: { porCarta: boolean; enviando: boolean; enviar: () => void; volver: () => void }) {
  return (
    <div role="alertdialog" aria-label="Confirmar la respuesta" className="flex flex-col gap-3 rounded-xl bg-[#fbf1dc] p-4 text-sm text-[#5d3b00]">
      <p>Al enviarla, la respuesta queda fija{porCarta ? "" : " y sale por correo"}. No se podrá editar.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={enviar} disabled={enviando} className={BOTON_PRINCIPAL}>
          <TextoDeEnvio enviando={enviando} texto="Enviar respuesta" textoAlEnviar="Enviando…" />
        </button>
        <button type="button" onClick={volver} className={BOTON_SECUNDARIO}>Seguir editando</button>
      </div>
    </div>
  );
}

/** Escribe las acciones adoptadas y, tras confirmar, las envía. Después no se edita. */
export function RespuestaDeLaHoja({ hoja, alResponder }: { hoja: HojaParaAtender; alResponder: (hoja: HojaParaAtender) => void }) {
  const formulario = useForm<DatosDeLaRespuesta>({ defaultValues: { respuesta: "", cartaEnviadaEl: "" } });
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const porCarta = hoja.medioDeRespuesta === "CARTA";

  function revisar({ respuesta, cartaEnviadaEl }: DatosDeLaRespuesta) {
    if (!respuesta.trim()) return formulario.setError("respuesta", { message: "Escribe la respuesta." });
    if (porCarta && !cartaEnviadaEl) return formulario.setError("cartaEnviadaEl", { message: "Indica la fecha en que enviaste la carta." });
    setConfirmando(true);
  }
  async function enviar() {
    setError(undefined);
    setEnviando(true);
    const { respuesta, cartaEnviadaEl } = formulario.getValues();
    const resultado = await responderHoja(hoja.numero, { texto: respuesta, ...(porCarta && { cartaEnviadaEl }) });
    setEnviando(false);
    if (resultado.tipo === "aceptado") return alResponder(resultado.cuerpo);
    setConfirmando(false);
    const rechazo = resultadoDeAccion(resultado);
    if (rechazo.tipo !== "hecho") setError(atenderRechazo(formulario, rechazo));
  }

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={(evento) => formulario.handleSubmit(revisar)(evento)} className="flex flex-col gap-4" aria-label="Responder la hoja">
        <CampoDeAreaDeTexto nombre="respuesta" etiqueta="Acciones adoptadas por La Previa" maximo={4000} filas={6} ayuda="Qué revisaron, qué decidieron y qué harán, con fechas y montos si aplica." />
        {porCarta ? (
          <CampoDeTexto nombre="cartaEnviadaEl" etiqueta="Fecha de envío de la carta" type="date" ayuda="La persona eligió carta: imprímela, envíala a su domicilio y anota el día." className="max-w-48" />
        ) : (
          <p className="text-sm text-grava">Se enviará a su correo y la verá en su seguimiento.</p>
        )}
        <ErrorGeneral mensaje={error} />
        {confirmando ? (
          <Confirmacion porCarta={porCarta} enviando={enviando} enviar={enviar} volver={() => setConfirmando(false)} />
        ) : (
          <button type="submit" className={`${BOTON_PRINCIPAL} self-start`}>Revisar y enviar</button>
        )}
      </form>
    </FormProvider>
  );
}
