"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alerta, Button, Input, Modal, Select } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { moneda } from "@/lib/formato";
import type { MetodoConfirmacion, TurnoAgenda } from "../api";
import {
  type DatosFormularioPago,
  esquemaConfirmarPago,
  METODOS_CONFIRMACION,
  type ValoresConfirmarPago,
} from "../schemas";

const CAMPOS = ["metodo", "numeroOperacion"] as const;

const ETIQUETA_METODO: Record<MetodoConfirmacion, string> = {
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
};

function diferencia(monto: number, resta: number) {
  return Math.max(Math.round(monto * 100) - Math.round(resta * 100), 0) / 100;
}

type Props = {
  turno: TurnoAgenda;
  onCerrar: () => void;
  onEnviar: (datos: DatosFormularioPago) => Promise<unknown>;
};

export function ConfirmarPago({ turno, onCerrar, onEnviar }: Props) {
  const formId = useId();
  const faltaAdelanto = diferencia(turno.adelantoMinimo, turno.adelantoPagado);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresConfirmarPago, unknown, DatosFormularioPago>({
    resolver: zodResolver(esquemaConfirmarPago),
    defaultValues: { metodo: "", monto: "ADELANTO", numeroOperacion: "" },
  });

  const enviar = handleSubmit(async (datos) => {
    try {
      await onEnviar(datos);
    } catch (error) {
      aplicarErroresServidor(error, setError, [...CAMPOS]);
    }
  });

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Confirmar pago"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} cargando={isSubmitting}>
            Confirmar pago
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <div className="rounded-lg border border-linea bg-fondo px-3 py-2 text-sm">
          <p className="font-medium tabular-nums">{turno.codigo}</p>
          <p>{turno.cliente.nombre}</p>
          <p className="text-texto-suave tabular-nums">
            {turno.cancha.nombre} · {turno.horaInicio}–{turno.horaFin}
          </p>
        </div>
        <p className="text-sm text-texto-suave">
          Revisa que el comprobante recibido coincida con el monto. La reserva quedará confirmada y el jugador lo verá en
          sus reservas.
        </p>
        <Alerta>{errors.root?.servidor?.message}</Alerta>
        <Select etiqueta="Monto recibido" error={errors.monto?.message} {...register("monto")}>
          <option value="ADELANTO">Adelanto: {moneda(faltaAdelanto)}</option>
          <option value="TOTAL">Turno completo: {moneda(turno.saldoPendiente)}</option>
        </Select>
        <Select etiqueta="Método de pago" error={errors.metodo?.message} {...register("metodo")}>
          <option value="">Elige un método</option>
          {METODOS_CONFIRMACION.map((metodo) => (
            <option key={metodo} value={metodo}>
              {ETIQUETA_METODO[metodo]}
            </option>
          ))}
        </Select>
        <Input
          etiqueta="Número de operación (opcional)"
          autoComplete="off"
          maxLength={30}
          error={errors.numeroOperacion?.message}
          {...register("numeroOperacion")}
        />
      </form>
    </Modal>
  );
}
