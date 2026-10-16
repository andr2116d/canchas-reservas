"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { conFiltro, hora } from "@/lib/filtros-entrada";
import { ETIQUETA_DIA } from "../api";
import type { ValoresHorario } from "../schemas";

export const PROPS_HORA = { inputMode: "numeric", placeholder: "HH:MM", maxLength: 5, autoComplete: "off" } as const;

const COLUMNAS = "md:grid-cols-[minmax(6rem,1fr)_7rem_minmax(0,1fr)_minmax(0,1fr)]";

type Props = {
  dias: { diaSemana: number; abierto: boolean }[];
  registro: UseFormRegister<ValoresHorario>;
  errores: FieldErrors<ValoresHorario>;
};

export function TablaHorario({ dias, registro, errores }: Props) {
  return (
    <div className="flex flex-col">
      <div aria-hidden className={cn("hidden gap-4 pb-2 text-sm font-medium text-texto-suave md:grid", COLUMNAS)}>
        <span>Día</span>
        <span>Abre</span>
        <span>Apertura</span>
        <span>Cierre</span>
      </div>
      <ul className="flex flex-col">
        {dias.map((dia, indice) => {
          const nombre = ETIQUETA_DIA[dia.diaSemana];
          const errorApertura = errores.dias?.[indice]?.apertura?.message;
          const errorCierre = errores.dias?.[indice]?.cierre?.message;
          return (
            <li
              key={dia.diaSemana}
              className={cn(
                "grid gap-3 border-t border-linea py-4 md:items-center md:gap-4",
                COLUMNAS,
                indice === 0 && "border-t-0",
              )}
            >
              <span className="font-medium">{nombre}</span>
              <Switch
                etiqueta="Abre"
                aria-label={`Abre ${nombre.toLowerCase()}`}
                {...registro(`dias.${indice}.abierto`)}
              />
              <Input
                etiqueta="Apertura"
                aria-label={`Apertura del ${nombre.toLowerCase()}`}
                {...PROPS_HORA}
                disabled={!dia.abierto}
                error={errorApertura}
                {...conFiltro(registro(`dias.${indice}.apertura`), hora)}
              />
              <Input
                etiqueta="Cierre"
                aria-label={`Cierre del ${nombre.toLowerCase()}`}
                {...PROPS_HORA}
                disabled={!dia.abierto}
                error={errorCierre}
                {...conFiltro(registro(`dias.${indice}.cierre`), hora)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}