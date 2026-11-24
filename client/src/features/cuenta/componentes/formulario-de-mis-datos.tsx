"use client";

import { FormProvider } from "react-hook-form";
import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { filtrarCelular, filtrarDorsal } from "@/compartido/formulario/filtros-de-entrada";
import { LARGO_DEL_USUARIO_DE_CORREO } from "@/compartido/formulario/regla-de-usuario-de-correo";
import { LARGOS } from "@/compartido/formulario/reglas-de-datos-personales";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { useMisDatos } from "../hooks/use-mis-datos";

/** El correo según el rol: libre para el jugador, institucional para el personal. */
function CampoDelCorreo({ cuenta, dominio }: { cuenta: Cuenta; dominio: string }) {
  if (cuenta.rol === "JUGADOR") {
    return <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" autoComplete="email" spellCheck={false} maxLength={LARGOS.correo} />;
  }
  if (!cuenta.editables.includes("correo")) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-tinta">Correo de La Previa</p>
        <p className="font-bold text-tinta">{cuenta.correo}</p>
        <p className="text-sm text-grava">Es tu usuario del sistema: lo asigna administración.</p>
      </div>
    );
  }
  return (
    <CampoDeTexto
      nombre="usuarioDeCorreo"
      etiqueta="Correo de La Previa"
      autoComplete="off"
      spellCheck={false}
      autoCapitalize="none"
      maxLength={LARGO_DEL_USUARIO_DE_CORREO}
      ayuda={`Es tu usuario del sistema como administración: siempre termina en @${dominio}. Al cambiarlo se cierran tus otras sesiones.`}
      style={{ paddingRight: `${dominio.length + 3}ch` }}
      accesorio={<span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-grava">@{dominio}</span>}
    />
  );
}

/** Lo que cada rol cambia de su cuenta: nombres y fecha para corregir errores, correo y celular. */
export function FormularioDeMisDatos({ cuenta }: { cuenta: Cuenta }) {
  const { formulario, enviar, guardado, errorGeneral, dominio } = useMisDatos(cuenta);
  const { isSubmitting } = formulario.formState;
  const editable = (dato: Cuenta["editables"][number]) => cuenta.editables.includes(dato);

  return (
    <FormProvider {...formulario}>
      <form noValidate onSubmit={enviar} aria-label="Mis datos" className="flex flex-col gap-5">
        {editable("nombres") && (
          <div className="grid gap-5 sm:grid-cols-2">
            <CampoDeTexto nombre="nombres" etiqueta="Nombres" autoComplete="given-name" maxLength={LARGOS.nombre} />
            <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" autoComplete="family-name" maxLength={LARGOS.nombre} />
          </div>
        )}
        {editable("fechaNacimiento") && <CampoDeTexto nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" />}
        <CampoDelCorreo cuenta={cuenta} dominio={dominio} />
        <div className="grid gap-5 sm:grid-cols-2">
          {editable("celular") && (
            <CampoDeTexto nombre="celular" etiqueta="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" filtrarEntrada={filtrarCelular} />
          )}
          {editable("dorsal") && (
            <CampoDeTexto nombre="dorsal" etiqueta="Dorsal" opcional inputMode="numeric" ayuda="Del 1 al 99." filtrarEntrada={filtrarDorsal} />
          )}
        </div>
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
