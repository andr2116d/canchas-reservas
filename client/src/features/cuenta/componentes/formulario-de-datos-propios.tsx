"use client";

import Link from "next/link";
import { FormProvider } from "react-hook-form";
import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { CamposDelDocumento } from "@/compartido/formulario/campos-del-documento";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { filtrarCelular } from "@/compartido/formulario/filtros-de-entrada";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";
import { useDatosPropios } from "../hooks/use-datos-propios";
import { DocumentoFijo } from "@/compartido/formulario/documento-fijo";

interface FormularioDeDatosPropiosProps {
  cuenta: Cuenta;
  /** A dónde sigue al guardar: el cambio de contraseña o el panel. */
  siguiente: string;
}

/** Primer ingreso: el administrador completa sus datos; la recepcionista los confirma o corrige. */
export function FormularioDeDatosPropios({ cuenta, siguiente }: FormularioDeDatosPropiosProps) {
  const { formulario, enviar, errorGeneral, documentoFijo } = useDatosPropios(cuenta, siguiente);
  const { isSubmitting } = formulario.formState;

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} aria-label="Tus datos" className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="given-name" maxLength={LARGOS.nombre} />
          <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="family-name" maxLength={LARGOS.nombre} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoDeTexto nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" />
          <CampoDeTexto nombre="celular" etiqueta="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" filtrarEntrada={filtrarCelular} />
        </div>
        {documentoFijo ? <DocumentoFijo cuenta={cuenta} /> : <CamposDelDocumento />}
        <p className="rounded-xl bg-tiza px-4 py-3 text-sm text-grava">
          Al continuar confirmas que tus datos son correctos. Así los tratamos:{" "}
          <Link href={RUTA_DEL_AVISO_DEL_PERSONAL} className="font-bold text-botella underline underline-offset-4">
            aviso de privacidad del personal
          </Link>
          .
        </p>
        <ErrorGeneral mensaje={errorGeneral} />
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${BOTON_PRINCIPAL} w-full`}>
          <TextoDeEnvio enviando={isSubmitting} texto={documentoFijo ? "Mis datos son correctos" : "Guardar mis datos"} textoAlEnviar="Guardando…" />
        </button>
      </form>
    </FormProvider>
  );
}
