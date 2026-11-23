"use client";

import { FormProvider } from "react-hook-form";
import { useAltaDeRecepcionista } from "../hooks/use-alta-de-recepcionista";
import { AvisoDeReactivacion } from "./aviso-de-reactivacion";
import { CampoDeContrasenaTemporal } from "./campo-de-contrasena-temporal";
import { CamposDeRecepcionista } from "./campos-de-recepcionista";
import { CredencialesEntregables } from "./credenciales-entregables";
import { BOTON_PRINCIPAL, TARJETA } from "./estilos";

/** Formulario del administrador para crear la cuenta de una recepcionista. */
export function FormularioDeAlta({ dominio }: { dominio: string }) {
  const alta = useAltaDeRecepcionista();
  const { isSubmitting } = alta.formulario.formState;

  if (alta.creada) {
    return (
      <CredencialesEntregables
        id={alta.creada.id}
        correo={`${alta.creada.usuarioDeCorreo}@${dominio}`}
        contrasena={alta.creada.contrasena}
        alCrearOtra={alta.crearOtra}
      />
    );
  }

  return (
    <FormProvider {...alta.formulario}>
      <form noValidate onSubmit={alta.enviar} className={`${TARJETA} flex flex-col gap-6`}>
        <CamposDeRecepcionista dominio={dominio} />
        <CampoDeContrasenaTemporal />
        {alta.errorGeneral && (
          <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{alta.errorGeneral}</p>
        )}
        {alta.reactivacion.reactivable && (
          <AvisoDeReactivacion
            nombres={alta.reactivacion.reactivable.nombres}
            reactivando={alta.reactivacion.reactivando}
            alReactivar={alta.reactivacion.reactivar}
            alCancelar={alta.reactivacion.cancelar}
          />
        )}
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${BOTON_PRINCIPAL} self-start`}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </FormProvider>
  );
}
