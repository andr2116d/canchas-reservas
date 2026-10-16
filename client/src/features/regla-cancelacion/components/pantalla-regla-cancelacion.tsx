"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, EmptyState, Input, Select, useToast } from "@/components/ui";
import type { ReglaCancelacion, TipoCompensacion } from "../api";
import { useActualizarRegla, useReglaCancelacion } from "../hooks";
import { esquemaRegla, type DatosReglaFormulario, type ValoresRegla } from "../schemas";

const DESTINO_ADELANTO: Record<TipoCompensacion, string> = {
  DEVOLUCION: "en recepción",
  CREDITO: "como crédito",
};

function fraseDelJugador(horas: string, compensacion: TipoCompensacion) {
  const valor = horas.trim() === "" ? null : Number(horas);
  const cuando =
    valor === null || Number.isNaN(valor)
      ? "con la anticipación indicada"
      : valor === 0
        ? "hasta el inicio del turno"
        : `hasta ${valor} h antes del inicio del turno`;
  return `Puedes cancelar ${cuando} y se te devolverá tu adelanto ${DESTINO_ADELANTO[compensacion]}. Si cancelas después, el adelanto queda retenido.`;
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
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ValoresRegla, unknown, DatosReglaFormulario>({
    resolver: zodResolver(esquemaRegla),
    defaultValues: aValores(regla),
  });
  const { horasAnticipacion: horas, tipoCompensacion: compensacion } = useWatch({ control });

  const enviar = handleSubmit(async (datos) => {
    const guardada = await actualizar.mutateAsync(datos);
    reset(aValores(guardada));
    toast.exito("Regla de cancelación guardada");
  });

  return (
    <>
      <Card>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <div className="max-w-48">
            <Input
              etiqueta="Horas de anticipación"
              type="number"
              min={0}
              step={1}
              ayuda="Número entero de horas, mínimo 0."
              {...register("horasAnticipacion")}
            />
          </div>

          <div className="max-w-48">
            <Select etiqueta="Compensación del adelanto" {...register("tipoCompensacion")}>
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

      <div className="rounded-lg border border-linea bg-fondo px-3 py-2 text-sm">
        <p className="font-medium">Así lo verá el jugador</p>
        <p className="text-texto-suave">{fraseDelJugador(horas ?? "", (compensacion ?? regla.tipoCompensacion) as TipoCompensacion)}</p>
      </div>
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
