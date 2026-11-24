"use client";

import { FormProvider } from "react-hook-form";
import type { DatosDeEdicion } from "../esquemas/recepcionista.schema";
import { useEdicionDeRecepcionista } from "../hooks/use-edicion-de-recepcionista";
import { CamposDeRecepcionista } from "./campos-de-recepcionista";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { ErrorGeneral } from "@/compartido/formulario/error-general";

interface FormularioDeEdicionProps {
  id: number;
  dominio: string;
  datos: DatosDeEdicion;
}

/** Datos personales y correo de una recepcionista, editables por el administrador. */
export function FormularioDeEdicion({ id, dominio, datos }: FormularioDeEdicionProps) {
  const { formulario, enviar, guardado, errorGeneral } = useEdicionDeRecepcionista(id, datos);
  const { isSubmitting } = formulario.formState;

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
        <CamposDeRecepcionista dominio={dominio} />
        <ErrorGeneral mensaje={errorGeneral} />
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
            <TextoDeEnvio enviando={isSubmitting} texto="Guardar cambios" textoAlEnviar="Guardando…" />
          </button>
          {guardado && <p role="status" className="font-semibold text-botella">Cambios guardados.</p>}
        </div>
      </form>
    </FormProvider>
  );
}
