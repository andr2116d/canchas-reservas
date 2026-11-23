"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";
import { MarcadorDeHora } from "./marcador-de-hora";

type Hora = "abre" | "cierra" | "inicioDeLaNoche";
type CampoDeHorario = Hora | `distintos.${number}.${Hora}`;

interface CampoDeHoraProps {
  nombre: CampoDeHorario;
  id: string;
  etiqueta: string;
  ayuda?: string;
  hastaMedianoche?: boolean;
  chico?: boolean;
}

/** Marcador de hora enlazado a un campo del formulario del horario, con su error. */
export function CampoDeHora({ nombre, ...marcador }: CampoDeHoraProps) {
  const { control } = useFormContext<DatosDelFormularioDeHorario>();
  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field, fieldState }) => (
        <MarcadorDeHora {...marcador} valor={field.value} alCambiar={(valor) => field.onChange(valor)} error={fieldState.error?.message} />
      )}
    />
  );
}
