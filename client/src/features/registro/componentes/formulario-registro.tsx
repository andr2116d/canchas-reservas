"use client";

import type { FormEventHandler, ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { soloDigitos } from "../utilidades/solo-digitos";
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
    <section className="flex flex-col gap-4 border-t border-linea pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <div>
        <h2 className="font-titular text-xl font-extrabold text-tinta">{titulo}</h2>
        <p className="text-sm text-grava">{explicacion}</p>
      </div>
      {children}
    </section>
  );
}

/** Quién es el jugador: nombre, edad, dorsal y documento. */
function GrupoDelJugador() {
  return (
    <Grupo titulo="Quién juega" explicacion="Para crear tu cuenta debes ser mayor de edad.">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="given-name" />
        <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="family-name" />
        <CampoDeTexto nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" autoComplete="bday" />
        <CampoDeTexto nombre="dorsal" etiqueta="Dorsal" opcional inputMode="numeric" maxLength={2} placeholder="Del 1 al 99" />
      </div>
      <CamposDelDocumento />
    </Grupo>
  );
}

/** Cómo contactarlo y con qué entra a su cuenta. */
function GrupoDeContactoYAcceso() {
  return (
    <Grupo titulo="Contacto y acceso" explicacion="Con tu correo y contraseña entras a tu cuenta. Al celular te avisamos de tus reservas.">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="celular" etiqueta="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" filtrarEntrada={soloDigitos} />
        <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" autoComplete="email" spellCheck={false} />
      </div>
      <CampoContrasena />
    </Grupo>
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
    <form noValidate onSubmit={alEnviarRegistro} className="flex flex-col gap-6">
      <GrupoDelJugador />
      <GrupoDeContactoYAcceso />
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
      <p className="-mt-3 text-center text-sm text-grava">Guardamos tus datos personales cifrados.</p>
    </form>
  );
}
