"use client";

import type { FormEventHandler, ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { usePaginaActiva } from "../hooks/use-pagina-activa";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { CamposDelDocumento } from "@/compartido/formulario/campos-del-documento";
import { filtrarCelular, filtrarDorsal } from "@/compartido/formulario/filtros-de-entrada";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { AceptacionLegalDelRegistro } from "./aceptacion-legal-del-registro";
import { CampoContrasena } from "./campo-contrasena";

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
    <Grupo titulo="Quién juega" explicacion="Para crear tu cuenta de titular debes tener 18 años cumplidos.">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="given-name" maxLength={LARGOS.nombre} />
        <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="family-name" maxLength={LARGOS.nombre} />
        <CampoDeTexto nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" autoComplete="bday" />
        <CampoDeTexto nombre="dorsal" etiqueta="Dorsal" opcional inputMode="numeric" filtrarEntrada={filtrarDorsal} placeholder="Del 1 al 99" />
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
        <CampoDeTexto nombre="celular" etiqueta="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" filtrarEntrada={filtrarCelular} />
        <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" autoComplete="email" spellCheck={false} maxLength={LARGOS.correo} />
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
  const paginaActiva = usePaginaActiva();

  return (
    <form noValidate onSubmit={alEnviarRegistro}>
      {/* Hasta que la página se activa, lo escrito se perdería: los campos esperan deshabilitados. */}
      <fieldset disabled={!paginaActiva} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
        <GrupoDelJugador />
        <GrupoDeContactoYAcceso />
        <AceptacionLegalDelRegistro />
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
      </fieldset>
    </form>
  );
}
