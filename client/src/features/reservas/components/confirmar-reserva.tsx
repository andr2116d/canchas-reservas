"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { diaYHoraEnLima, moneda, fecha } from "@/lib/formato";
import { useCrearReserva, useResumenReserva } from "../hooks";
import { ErrorApi } from "@/lib/api";
import type { ReservaCreada, ResumenReserva } from "../api";

const DESTINO_ADELANTO: Record<ResumenReserva["regla"]["tipoCompensacion"], string> = {
  DEVOLUCION: "en recepción",
  CREDITO: "como crédito",
};

function textoReglaCancelacion({ horasAnticipacion, tipoCompensacion, plazoLimite }: ResumenReserva["regla"]) {
  const hasta =
    horasAnticipacion === 0
      ? "hasta el inicio del turno"
      : `hasta el ${diaYHoraEnLima(plazoLimite)} (${horasAnticipacion} h antes)`;
  return `Puedes cancelar ${hasta} y se te devolverá tu adelanto ${DESTINO_ADELANTO[tipoCompensacion]}. Si cancelas después, el adelanto queda retenido.`;
}

function formatearTiempo(restanteMs: number) {
  if (restanteMs <= 0) return "00:00";
  const minutos = Math.floor(restanteMs / 60000);
  const segundos = Math.floor((restanteMs % 60000) / 1000);
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function leerParametros(searchParams: ReturnType<typeof useSearchParams> | null, props: Props) {
  const canchaId = props.canchaId ?? Number(searchParams?.get("canchaId"));
  const fechaParam = props.fecha ?? searchParams?.get("fecha") ?? "";
  const horaInicio = props.horaInicio ?? searchParams?.get("horaInicio") ?? "";
  return { canchaId, fecha: fechaParam, horaInicio };
}

type Props = {
  canchaId?: number;
  fecha?: string;
  horaInicio?: string;
};

export function PantallaConfirmarReserva(props: Props = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { canchaId, fecha: fechaParam, horaInicio } = leerParametros(searchParams, props);

  const paramsValidos = Boolean(canchaId && fechaParam && horaInicio);

  const { data: resumen, isLoading, isError, error } = useResumenReserva(
    paramsValidos ? { canchaId: canchaId!, fecha: fechaParam, horaInicio } : null,
  );

  const [usarCredito, setUsarCredito] = useState(false);
  const [creada, setCreada] = useState<ReservaCreada | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState("");

  const crear = useCrearReserva();

  const creditoAplicado = useMemo(() => {
    if (!resumen || !usarCredito) return 0;
    return Math.min(resumen.adelanto, resumen.creditoDisponible);
  }, [resumen, usarCredito]);

  const adelantoAPagar = useMemo(() => {
    if (!resumen) return 0;
    return (Math.round(resumen.adelanto * 100) - Math.round(creditoAplicado * 100)) / 100;
  }, [resumen, creditoAplicado]);

  useEffect(() => {
    if (!creada?.venceEn) return;
    const actualizar = () => {
      setTiempoRestante(formatearTiempo(new Date(creada.venceEn!).getTime() - Date.now()));
    };
    actualizar();
    const id = setInterval(actualizar, 1000);
    return () => clearInterval(id);
  }, [creada]);

  const confirmar = async () => {
    if (!paramsValidos) return;
    try {
      const resultado = await crear.mutateAsync({
        canchaId: canchaId!,
        fecha: fechaParam,
        horaInicio,
        usarCredito,
      });
      setCreada(resultado);
      setToast(null);
    } catch (err) {
      const mensaje =
        err instanceof ErrorApi ? err.message : err instanceof Error ? err.message : "Ocurrió un error";
      setToast(mensaje);
      const status = err instanceof ErrorApi ? err.status : 0;
      if (status === 409 || status === 400) {
        setTimeout(() => router.push("/jugador/disponibilidad"), 0);
      }
    }
  };

  if (creada) {
    return (
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6">
        {toast && <Toast mensaje={toast} />}
        <Card className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">
            ¡Reserva confirmada!
          </h1>
          <p className="text-sm text-texto-suave">Tu código de reserva</p>
          <p className="font-display text-3xl font-bold tabular-nums text-cesped-700">
            {creada.codigo}
          </p>
          {creada.estado === "CONFIRMADA" ? (
            <p className="text-sm text-texto-suave">Pagaste el adelanto con tu crédito.</p>
          ) : (
            <p className="text-sm text-texto-suave">
              Tiempo para pagar el adelanto: {tiempoRestante}
            </p>
          )}
          <Button variante="secundario" onClick={() => router.push("/jugador/disponibilidad")}>
            Volver a la grilla
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6">
      {toast && <Toast mensaje={toast} />}

      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">
          Confirmar reserva
        </h1>
      </header>

      {isLoading && <p className="text-texto-suave">Cargando resumen…</p>}

      {isError && (
        <p className="text-error">
          {(error as Error)?.message ?? "No se pudo cargar el resumen"}
        </p>
      )}

      {!paramsValidos && (
        <p className="text-error">Faltan datos del turno seleccionado.</p>
      )}

      {paramsValidos && resumen && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-texto-suave">
              {resumen.cancha.nombre} · {resumen.cancha.tamano === "FUTBOL_5" ? "Fútbol 5" : "Fútbol 7"}
            </p>
            <p className="font-display text-3xl font-bold tabular-nums">
              {fecha(resumen.fecha)} {resumen.horaInicio}
            </p>
            <div>
              <Badge tono={resumen.franja === "NOCHE" ? "info" : "neutro"}>
                {resumen.franja === "NOCHE" ? "Noche" : "Día"}
              </Badge>
            </div>
          </div>

          <dl className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-texto-suave">Valor del turno</dt>
              <dd className="tabular-nums">{moneda(resumen.valorTurno)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-texto-suave">Adelanto mínimo (50 %)</dt>
              <dd className="tabular-nums">{moneda(resumen.adelanto)}</dd>
            </div>
            <div className="flex items-center justify-between font-medium">
              <dt className="text-sm">Saldo a pagar al llegar</dt>
              <dd className="tabular-nums">{moneda(resumen.saldo)}</dd>
            </div>
          </dl>

          {resumen.creditoDisponible > 0 && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={usarCredito}
                  onChange={(e) => setUsarCredito(e.target.checked)}
                />
                Usar mi crédito ({moneda(resumen.creditoDisponible)} disponible)
              </label>
              {usarCredito && (
                <p className="text-sm text-texto-suave">
                  Adelanto a pagar: {moneda(adelantoAPagar)}
                </p>
              )}
            </div>
          )}

          <div className="rounded-lg bg-alerta-fondo px-3 py-2 text-sm text-alerta">
            Tienes {resumen.minutosParaPagar} minutos para pagar el adelanto o la reserva se libera.
          </div>

          <div className="rounded-lg border border-linea bg-fondo px-3 py-2 text-sm">
            <p className="font-medium">Regla de cancelación</p>
            <p className="text-texto-suave">{textoReglaCancelacion(resumen.regla)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button cargando={crear.isPending} onClick={confirmar}>
              Confirmar reserva
            </Button>
            <Button variante="secundario" onClick={() => router.push("/jugador/disponibilidad")}>
              Volver a la grilla
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}

function Toast({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 rounded-lg bg-error-fondo px-4 py-2 text-sm text-error shadow-sm"
    >
      {mensaje}
    </div>
  );
}

export const PantallaConfirmacionReserva = PantallaConfirmarReserva;
export const ConfirmarReserva = PantallaConfirmarReserva;
export const ConfirmacionReserva = PantallaConfirmarReserva;
export default PantallaConfirmarReserva;