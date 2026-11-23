"use client";

import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { CamposDelDocumento } from "@/compartido/formulario/campos-del-documento";
import { filtrarCelular } from "@/compartido/formulario/filtros-de-entrada";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { CampoDeCorreoInstitucional } from "./campo-de-correo-institucional";

/** Datos personales y correo institucional de una recepcionista, para el alta y la edición. */
export function CamposDeRecepcionista({ dominio }: { dominio: string }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="off" maxLength={LARGOS.nombre} />
        <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="off" maxLength={LARGOS.nombre} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoDeTexto nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" />
        <CampoDeTexto
          nombre="celular"
          etiqueta="Celular"
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          filtrarEntrada={filtrarCelular}
        />
      </div>
      <CamposDelDocumento />
      <CampoDeCorreoInstitucional dominio={dominio} />
    </>
  );
}
