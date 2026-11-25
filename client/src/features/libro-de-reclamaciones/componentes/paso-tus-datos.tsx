"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { CamposDelDocumento } from "@/compartido/formulario/campos-del-documento";
import { Casilla } from "./casilla";

function DatosDelRepresentante() {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-linea bg-tiza/60 p-4">
      <legend className="px-1 text-sm font-bold text-cancha">Tu padre, madre o representante</legend>
      <CampoDeTexto nombre="representanteNombre" etiqueta="Nombres y apellidos" autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="representanteTelefono" etiqueta="Teléfono" inputMode="tel" autoComplete="off" />
        <CampoDeTexto nombre="representanteCorreo" etiqueta="Correo" type="email" autoComplete="off" />
      </div>
      <CampoDeTexto nombre="representanteDomicilio" etiqueta="Domicilio" autoComplete="off" />
    </fieldset>
  );
}

/** Paso 1: quién reclama. Solo los datos del formato oficial. */
export function PasoTusDatos() {
  const { control } = useFormContext();
  const esMenor = useWatch({ control, name: "esMenorDeEdad" }) as boolean;

  return (
    <div className="flex flex-col gap-4">
      <CamposDelDocumento />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="given-name" />
        <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="family-name" />
      </div>
      <CampoDeTexto nombre="domicilio" etiqueta="Domicilio" autoComplete="street-address" ayuda="Si eliges respuesta por carta, llega aquí." />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nombre="telefono" etiqueta="Teléfono" inputMode="tel" autoComplete="tel" ayuda="Celular o fijo con código de ciudad." />
        <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" autoComplete="email" ayuda="Aquí te llega la copia de tu hoja." />
      </div>
      <Casilla nombre="esMenorDeEdad">Soy menor de edad</Casilla>
      {esMenor && <DatosDelRepresentante />}
    </div>
  );
}
