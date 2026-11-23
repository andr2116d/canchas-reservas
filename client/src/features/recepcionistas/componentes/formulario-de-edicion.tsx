"use client";

import { FormProvider } from "react-hook-form";
import type { DatosDeEdicion } from "../esquemas/recepcionista.schema";
import { useEdicionDeRecepcionista } from "../hooks/use-edicion-de-recepcionista";
import { CamposDeRecepcionista } from "./campos-de-recepcionista";
import { BOTON_PRINCIPAL } from "./estilos";

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
        {errorGeneral && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{errorGeneral}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={BOTON_PRINCIPAL}>
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </button>
          {guardado && <p role="status" className="font-semibold text-botella">Cambios guardados.</p>}
        </div>
      </form>
    </FormProvider>
  );
}
