"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Path } from "react-hook-form";
import { Alerta, Button, Card, Input, useToast } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import {
  reservasFueraDeHorario,
  type DatosGuardarHorario,
  type Horario,
  type ReservaFueraDeHorario,
} from "../api";
import { useGuardarHorario } from "../hooks";
import { esquemaHorario, valoresDeHorario, type DatosHorario, type ValoresHorario } from "../schemas";
import { ConfirmarFueraHorario } from "./confirmar-fuera-horario";
import { TablaHorario } from "./tabla-horario";

const CAMPOS = [
  "inicioNoche",
  "dias",
  ...[0, 1, 2, 3, 4, 5, 6].flatMap((indice) => [
    `dias.${indice}`,
    `dias.${indice}.abierto`,
    `dias.${indice}.apertura`,
    `dias.${indice}.cierre`,
  ]),
] as Path<ValoresHorario>[];

type Conflicto = { datos: DatosGuardarHorario; reservas: ReservaFueraDeHorario[] };

function aGuardar(valores: DatosHorario): DatosGuardarHorario {
  return {
    dias: valores.dias.map(({ diaSemana, abierto, apertura, cierre }) => ({
      diaSemana,
      abierto,
      apertura: abierto ? apertura : null,
      cierre: abierto ? cierre : null,
    })),
    inicioNoche: valores.inicioNoche,
  };
}

export function FormularioHorario({ horario }: { horario: Horario }) {
  const toast = useToast();
  const guardar = useGuardarHorario();
  const [conflicto, setConflicto] = useState<Conflicto | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresHorario, unknown, DatosHorario>({
    resolver: zodResolver(esquemaHorario),
    defaultValues: valoresDeHorario(horario.dias, horario.inicioNoche),
  });

  const dias = useWatch({ control, name: "dias" });

  const enviar = handleSubmit(async (valores) => {
    const datos = aGuardar(valores);
    try {
      await guardar.mutateAsync(datos);
      setConflicto(null);
      toast.exito("Horario guardado");
    } catch (error) {
      const reservas = reservasFueraDeHorario(error);
      if (reservas) {
        setConflicto({ datos, reservas });
        return;
      }
      aplicarErroresServidor(error, setError, CAMPOS);
    }
  });

  const guardarIgual = () => {
    if (!conflicto) return;
    guardar.mutate(
      { ...conflicto.datos, confirmar: true },
      {
        onSuccess: () => {
          setConflicto(null);
          toast.exito("Horario guardado");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-6">
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <Alerta>{errors.root?.servidor?.message}</Alerta>
        <TablaHorario dias={dias} registro={register} errores={errors} />
        <div className="max-w-48">
          <Input
            etiqueta="La noche empieza a las"
            type="time"
            error={errors.inicioNoche?.message}
            {...register("inicioNoche")}
          />
        </div>
        <div>
          <Button type="submit" cargando={isSubmitting}>
            Guardar horario
          </Button>
        </div>
      </form>
      {conflicto && (
        <ConfirmarFueraHorario
          abierto
          reservas={conflicto.reservas}
          enviando={guardar.isPending}
          onCerrar={() => setConflicto(null)}
          onConfirmar={guardarIgual}
        />
      )}
    </Card>
  );
}