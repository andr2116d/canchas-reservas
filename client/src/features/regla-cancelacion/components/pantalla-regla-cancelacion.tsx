"use client";

import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alerta, Button, Card, EmptyState, Input, Select, useToast } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import type { ReglaCancelacion, TipoCompensacion } from "../api";
import { useActualizarRegla, useReglaCancelacion } from "../hooks";
import { esquemaRegla, type DatosReglaFormulario, type ValoresRegla } from "../schemas";
import { textoReglaCancelacion } from "../texto-regla";

type ControlRegla = Control<ValoresRegla, unknown, DatosReglaFormulario>;

function VistaPrevia({ control, tipoInicial }: { control: ControlRegla; tipoInicial: TipoCompensacion }) {
  const { horasAnticipacion, tipoCompensacion } = useWatch({ control });
  const horas = esquemaRegla.shape.horasAnticipacion.safeParse(horasAnticipacion);
  const tipo = esquemaRegla.shape.tipoCompensacion.safeParse(tipoCompensacion);
  return (
    <div className="rounded-lg border border-linea bg-fondo px-3 py-2 text-sm">
      <p className="font-medium">Así lo verá el jugador</p>
      <p className="text-texto-suave">
        {textoReglaCancelacion({
          horasAnticipacion: horas.success ? horas.data : null,
          tipoCompensacion: tipo.success ? tipo.data : tipoInicial,
        })}
      </p>
    </div>
  );
}

function Titulo() {
  return (
    <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">
      Regla de cancelación
    </h1>
  );
}

function ErrorCarga({ mensaje, reintentando, onReintentar }: { mensaje: string; reintentando: boolean; onReintentar: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        mensaje={mensaje}
        accion={
          <Button variante="secundario" cargando={reintentando} onClick={onReintentar}>
            Reintentar
          </Button>
        }
      />
    </div>
  );
}

function EsqueletoRegla() {
  return (
    <div aria-hidden data-testid="esqueleto-regla" className="flex flex-col gap-6">
      <div className="h-64 animate-pulse rounded-xl bg-linea" />
      <div className="h-16 animate-pulse rounded-lg bg-linea" />
    </div>
  );
}

function aValores({ horasAnticipacion, tipoCompensacion }: ReglaCancelacion): ValoresRegla {
  return { horasAnticipacion: String(horasAnticipacion), tipoCompensacion };
}

function FormularioRegla({ regla }: { regla: ReglaCancelacion }) {
  const toast = useToast();
  const actualizar = useActualizarRegla();
  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ValoresRegla, unknown, DatosReglaFormulario>({
    resolver: zodResolver(esquemaRegla),
    defaultValues: aValores(regla),
  });

  const enviar = handleSubmit(async (datos) => {
    try {
      const guardada = await actualizar.mutateAsync(datos);
      reset(aValores(guardada));
      toast.exito("Regla de cancelación guardada");
    } catch (error) {
      aplicarErroresServidor(error, setError, ["horasAnticipacion", "tipoCompensacion"]);
    }
  });

  return (
    <>
      <Card>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <Alerta>{errors.root?.servidor?.message}</Alerta>
          <div className="max-w-48">
            <Input
              etiqueta="Horas de anticipación"
              type="number"
              min={0}
              step={1}
              ayuda="Número entero de horas, mínimo 0."
              error={errors.horasAnticipacion?.message}
              {...register("horasAnticipacion")}
            />
          </div>

          <div className="max-w-48">
            <Select
              etiqueta="Compensación del adelanto"
              error={errors.tipoCompensacion?.message}
              {...register("tipoCompensacion")}
            >
              <option value="CREDITO">Crédito</option>
              <option value="DEVOLUCION">Devolución</option>
            </Select>
          </div>

          <div>
            <Button type="submit" cargando={isSubmitting} disabled={!isDirty}>
              Guardar
            </Button>
          </div>
        </form>
      </Card>

      <VistaPrevia control={control} tipoInicial={regla.tipoCompensacion} />
    </>
  );
}

export function PantallaReglaCancelacion() {
  const regla = useReglaCancelacion();

  return (
    <div className="flex flex-col gap-6">
      <Titulo />
      {regla.isPending ? (
        <EsqueletoRegla />
      ) : regla.isError ? (
        <ErrorCarga
          mensaje={regla.error.message}
          reintentando={regla.isFetching}
          onReintentar={() => regla.refetch()}
        />
      ) : (
        <FormularioRegla regla={regla.data} />
      )}
    </div>
  );
}
