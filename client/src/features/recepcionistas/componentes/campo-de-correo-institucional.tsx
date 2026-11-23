"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { LARGO_DEL_USUARIO_DE_CORREO } from "../esquemas/recepcionista.schema";
import { sugerirCorreo } from "../servicios/recepcionistas.api";
import { BOTON_SECUNDARIO } from "./estilos";

/**
 * Lo que va antes de la @ del correo institucional; el dominio es fijo. Se
 * escribe a mano o se genera con los nombres y apellidos, sin repetir.
 */
export function CampoDeCorreoInstitucional({ dominio }: { dominio: string }) {
  const { getValues, setValue, setError } = useFormContext();
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    const sugerido = await sugerirCorreo(getValues("nombres"), getValues("apellidos"));
    setGenerando(false);
    if (sugerido) {
      setValue("usuarioDeCorreo", sugerido, { shouldDirty: true, shouldValidate: true });
    } else {
      setError("usuarioDeCorreo", { message: "Escribe los nombres y apellidos para generar el correo." });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <CampoDeTexto
        nombre="usuarioDeCorreo"
        etiqueta="Correo institucional"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        maxLength={LARGO_DEL_USUARIO_DE_CORREO}
        style={{ paddingRight: `${dominio.length + 3}ch` }}
        accesorio={
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-grava">@{dominio}</span>
        }
      />
      <button type="button" onClick={generar} disabled={generando} className={`${BOTON_SECUNDARIO} self-start`}>
        {generando ? "Generando…" : "Generar correo"}
      </button>
    </div>
  );
}
