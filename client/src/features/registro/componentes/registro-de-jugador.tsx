"use client";

import { FormProvider } from "react-hook-form";
import { useRegistrarJugador } from "../hooks/use-registrar-jugador";
import { FormularioRegistro } from "./formulario-registro";
import { PanelDeLaFicha } from "./panel-de-la-ficha";

/** Pantalla de registro: la ficha en vivo a un lado y el formulario al otro. */
export function RegistroDeJugador() {
  const { formulario, enviarRegistro, errorGeneral } = useRegistrarJugador();

  return (
    <FormProvider {...formulario}>
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <PanelDeLaFicha />
        <main className="px-4 py-8 sm:px-10 lg:py-12">
          <div className="mx-auto max-w-xl">
            <h1 className="mb-6 font-titular text-4xl font-black text-balance text-tinta sm:mb-8 sm:text-5xl">
              Crea tu cuenta de jugador
            </h1>
            <FormularioRegistro alEnviarRegistro={enviarRegistro} errorGeneral={errorGeneral} />
          </div>
        </main>
      </div>
    </FormProvider>
  );
}
