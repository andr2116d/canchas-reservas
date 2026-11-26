"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { aDatosDeLaHoja, esquemaDeLaHoja, type FormularioDeLaHoja, hojaEnBlanco, PASOS_DE_LA_HOJA, pasoDelCampo } from "../esquemas/hoja.schema";
import type { Constancia } from "../servicios/libro";
import { registrarHoja } from "../servicios/libro.api";
import { ConstanciaDeLaHoja } from "./constancia-de-la-hoja";
import { IndicadorDePasos } from "./indicador-de-pasos";
import { PasoLoContratado } from "./paso-lo-contratado";
import { PasoTuReclamo } from "./paso-tu-reclamo";
import { PasoTusDatos } from "./paso-tus-datos";

export type DatosDeLaCuenta = Parameters<typeof hojaEnBlanco>[0];

const PASOS = [PasoTusDatos, PasoLoContratado, PasoTuReclamo];
const TITULOS = PASOS_DE_LA_HOJA.map((paso) => paso.titulo);

/** Lleva la hoja de a un paso y, si el server rechaza un dato, vuelve al paso donde está. */
function useHojaPorPasos(cuenta?: DatosDeLaCuenta) {
  const formulario = useForm<FormularioDeLaHoja>({ resolver: zodResolver(esquemaDeLaHoja), defaultValues: hojaEnBlanco(cuenta), mode: "onTouched" });
  const [paso, setPaso] = useState(0);
  const [constancia, setConstancia] = useState<Constancia>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  // Los errores del server se marcan después de mostrar su paso, cuando sus campos ya existen.
  const rechazados = useRef<Record<string, string>>(undefined);
  const [rechazos, setRechazos] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!rechazados.current) return;
    marcarErroresDelServer(formulario, rechazados.current);
    rechazados.current = undefined;
  }, [rechazos, formulario, paso]);

  function irAlPaso(siguiente: number) {
    setPaso(siguiente);
    requestAnimationFrame(() => titulo.current?.focus());
  }
  async function continuar() {
    if (await formulario.trigger(PASOS_DE_LA_HOJA[paso].campos)) irAlPaso(paso + 1);
  }
  async function alEnviar(valores: FormularioDeLaHoja) {
    setErrorGeneral(undefined);
    const respuesta = await registrarHoja(aDatosDeLaHoja(valores));
    if (respuesta.tipo === "aceptado") return setConstancia(respuesta.cuerpo);
    const resultado = resultadoDeAccion(respuesta);
    if (resultado.tipo === "error") return setErrorGeneral(resultado.mensaje);
    if (resultado.tipo === "datos-rechazados") {
      rechazados.current = resultado.errores;
      setPaso(Math.min(...Object.keys(resultado.errores).map(pasoDelCampo)));
      setRechazos((n) => n + 1);
    }
  }
  const enviar = (evento: FormEvent<HTMLFormElement>) => formulario.handleSubmit(alEnviar)(evento);
  return { formulario, paso, irAlPaso, continuar, enviar, constancia, errorGeneral, titulo };
}

/** La hoja del Libro de Reclamaciones en tres pasos; al enviarla muestra la constancia. */
export function FormularioDelLibro({ cuenta }: { cuenta?: DatosDeLaCuenta }) {
  const { formulario, paso, irAlPaso, continuar, enviar, constancia, errorGeneral, titulo } = useHojaPorPasos(cuenta);
  if (constancia) return <ConstanciaDeLaHoja constancia={constancia} />;
  const Paso = PASOS[paso];
  const ultimo = paso === PASOS.length - 1;
  const enviando = formulario.formState.isSubmitting;

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} aria-labelledby="paso-titulo" className="flex flex-col gap-6">
        <IndicadorDePasos pasos={TITULOS} actual={paso} />
        <h2 id="paso-titulo" ref={titulo} tabIndex={-1} className="font-titular text-3xl leading-none font-black text-cancha outline-none">
          {TITULOS[paso]}
        </h2>
        <Paso />
        <ErrorGeneral mensaje={errorGeneral} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linea pt-5">
          {paso > 0 ? <button type="button" onClick={() => irAlPaso(paso - 1)} className={BOTON_SECUNDARIO}>Atrás</button> : <span />}
          {ultimo ? (
            <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL}>
              <TextoDeEnvio enviando={enviando} texto="Enviar hoja" textoAlEnviar="Enviando…" />
            </button>
          ) : (
            <button type="button" onClick={continuar} className={BOTON_PRINCIPAL}>Continuar</button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
