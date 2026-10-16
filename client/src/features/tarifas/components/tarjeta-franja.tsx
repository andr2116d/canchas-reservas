"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alerta, Badge, Button, Card, Input, useToast } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { conFiltro, decimal } from "@/lib/filtros-entrada";
import { fechaEnLima, moneda } from "@/lib/formato";
import { calcularAdelanto, ETIQUETA_FRANJA, type Franja, type TarifaVigente } from "../api";
import { useDefinirTarifa } from "../hooks";
import { esquemaTarifa, type DatosTarifaFormulario, type ValoresTarifa } from "../schemas";

type Props = {
  canchaId: number;
  franja: Franja;
  vigente: TarifaVigente | null;
};

export function TarjetaFranja({ canchaId, franja, vigente }: Props) {
  const toast = useToast();
  const definir = useDefinirTarifa(canchaId);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ValoresTarifa, unknown, DatosTarifaFormulario>({
    resolver: zodResolver(esquemaTarifa),
    defaultValues: { valor: vigente ? vigente.valor.toFixed(2) : "" },
  });

  const enviar = handleSubmit(async ({ valor }) => {
    try {
      const guardada = await definir.mutateAsync({ franja, valor });
      reset({ valor: guardada.valor.toFixed(2) });
      toast.exito(`Tarifa de ${ETIQUETA_FRANJA[franja].toLowerCase()} guardada`);
    } catch (error) {
      aplicarErroresServidor(error, setError, ["valor"]);
    }
  });

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-noche-900">{ETIQUETA_FRANJA[franja]}</h2>
        {franja === "NOCHE" && <Badge className="bg-noche-900 text-cal-400">Franja noche</Badge>}
      </header>

      <div className="flex flex-col gap-1">
        {vigente ? (
          <>
            <p className="font-display text-[32px] font-bold leading-9 text-noche-900 tabular-nums">
              {moneda(vigente.valor)}
            </p>
            <p className="text-sm text-texto-suave">Rige desde el {fechaEnLima(vigente.vigenteDesde)}</p>
            <p className="text-sm text-texto-suave tabular-nums">
              Adelanto (50 %): {moneda(calcularAdelanto(vigente.valor))}
            </p>
          </>
        ) : (
          <p className="font-display text-[32px] font-bold leading-9 text-texto-suave">Sin tarifa</p>
        )}
      </div>

      <form noValidate onSubmit={enviar} className="flex flex-col gap-3">
        <Alerta>{errors.root?.servidor?.message}</Alerta>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              id={`valor-${franja.toLowerCase()}`}
              etiqueta="Nuevo valor por hora"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              error={errors.valor?.message}
              {...conFiltro(register("valor"), decimal)}
            />
          </div>
          <Button type="submit" cargando={isSubmitting} className="sm:mt-6">
            Guardar
          </Button>
        </div>
      </form>
    </Card>
  );
}
