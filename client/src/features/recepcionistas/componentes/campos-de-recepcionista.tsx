"use client";

import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { CamposDelDocumento } from "@/compartido/formulario/campos-del-documento";
import { DocumentoFijo } from "@/compartido/formulario/documento-fijo";
import { filtrarCelular } from "@/compartido/formulario/filtros-de-entrada";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { CampoDeCorreoInstitucional } from "./campo-de-correo-institucional";

interface CamposDeRecepcionistaProps {
  dominio: string;
  /** Al editar, el documento ya no se cambia: se muestra con candado. */
  documentoFijo?: { tipoDocumento: "DNI" | "CARNE_EXTRANJERIA"; numeroDocumento: string };
}

/** Datos personales y correo institucional de una recepcionista, para el alta y la edición. */
export function CamposDeRecepcionista({ dominio, documentoFijo }: CamposDeRecepcionistaProps) {
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
      {documentoFijo ? <DocumentoFijo cuenta={documentoFijo} /> : <CamposDelDocumento />}
      <CampoDeCorreoInstitucional dominio={dominio} />
    </>
  );
}
