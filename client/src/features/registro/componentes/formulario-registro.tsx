"use client";

import type { FormEventHandler, ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { CampoContrasena } from "./campo-contrasena";
import { CampoDeTexto } from "./campo-de-texto";
import { CamposDelDocumento } from "./campos-del-documento";

interface GrupoProps {
  titulo: string;
  explicacion: string;
  children: ReactNode;
}

/** Grupo de datos con una línea que explica para qué se piden. */
function Grupo({ titulo, explicacion, children }: GrupoProps) {
  return (
    <section className="flex flex-col gap-4 border-t border-linea pt-6 first-of-type:border-t-0 first-of-type:pt-0">
      <div>
        <h2 className="font-titular text-2xl font-extrabold text-tinta">{titulo}</h2>
        <p className="text-sm text-grava">{explicacion}</p>
      </div>
      {children}
    </section>
  );
}

export interface FormularioRegistroProps {
  alEnviarRegistro: FormEventHandler<HTMLFormElement>;
  errorGeneral?: string;
}

/** Datos de la cuenta agrupados por para qué sirven. */
export function FormularioRegistro({ alEnviarRegistro, errorGeneral }: FormularioRegistroProps) {
  const { formState } = useFormContext<DatosRegistro>();

  return (
    <form noValidate onSubmit={alEnviarRegistro} className="flex flex-col gap-8">
      <p className="text-sm text-grava">Todos los datos son obligatorios.</p>
      <Grupo titulo="Quién juega" explicacion="Tu nombre aparece en tus reservas.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="given-name" />
          <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="family-name" />
        </div>
        <CamposDelDocumento />
      </Grupo>
      <Grupo titulo="Contacto" explicacion="Con tu correo entras a tu cuenta. Al celular te avisamos de tus reservas.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoDeTexto nombre="celular" etiqueta="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" />
          <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" autoComplete="email" spellCheck={false} />
        </div>
      </Grupo>
      <Grupo titulo="Acceso" explicacion="Con ella y tu correo inicias sesión.">
        <CampoContrasena />
      </Grupo>
      {errorGeneral && (
        <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm font-medium text-error">
          {errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={formState.isSubmitting}
        aria-busy={formState.isSubmitting}
        className="rounded-xl bg-botella px-6 py-4 text-base font-bold text-papel transition-colors hover:bg-botella-oscura focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-botella disabled:cursor-wait disabled:opacity-70"
      >
        {formState.isSubmitting ? "Creando tu cuenta…" : "Crear mi cuenta"}
      </button>
      <p className="-mt-4 text-center text-sm text-grava">Guardamos tus datos personales cifrados.</p>
    </form>
  );
}
