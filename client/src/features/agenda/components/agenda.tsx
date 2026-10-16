"use client";

import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CampoFecha } from "@/components/ui/campo-fecha";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/campo";
import { useToast } from "@/components/ui/toast";
import { fecha as fechaEnPantalla, hoyEnLima, moneda } from "@/lib/formato";
import { useTurnosEnVivo } from "@/lib/use-turnos-en-vivo";
import { useCanchas } from "@/features/canchas/hooks";
import { useAgenda, useConfirmarPago } from "../hooks";
import type { EstadoReserva, TurnoAgenda } from "../api";
import { ConfirmarPago } from "./confirmar-pago";

const ESTADOS: EstadoReserva[] = [
  "PENDIENTE_PAGO",
  "PENDIENTE_VALIDACION",
  "CONFIRMADA",
  "EN_JUEGO",
  "FINALIZADA",
  "CANCELADA",
  "EXPIRADA",
  "AUSENTE",
];

const ESTADOS_DEL_DIA: EstadoReserva[] = [
  "PENDIENTE_PAGO",
  "PENDIENTE_VALIDACION",
  "CONFIRMADA",
  "EN_JUEGO",
  "FINALIZADA",
];

const ESTADOS_CON_SALDO: EstadoReserva[] = ["CONFIRMADA", "EN_JUEGO"];

const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PENDIENTE_VALIDACION: "Pendiente de validación",
  CONFIRMADA: "Confirmada",
  EN_JUEGO: "En juego",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
  AUSENTE: "Ausente",
};

function tonoEstado(estado: EstadoReserva) {
  switch (estado) {
    case "PENDIENTE_PAGO":
    case "PENDIENTE_VALIDACION":
      return "alerta";
    case "CONFIRMADA":
      return "info";
    case "EN_JUEGO":
      return "juego";
    case "FINALIZADA":
    case "EXPIRADA":
      return "neutro";
    case "CANCELADA":
    case "AUSENTE":
      return "error";
    default:
      return "neutro";
  }
}

const ETIQUETA_ACCION: Record<string, string> = {
  CONFIRMAR_PAGO: "Confirmar pago",
  CHECK_IN: "Check-in",
  MARCAR_AUSENTE: "Marcar ausente",
  CANCELAR: "Cancelar",
  REUBICAR: "Reubicar",
  REGISTRAR_ADICIONALES: "Adicionales",
  FINALIZAR: "Finalizar",
};

const AVISO_ACCIONES = "Disponible en el próximo sprint";

type PropsTurno = { turno: TurnoAgenda; onConfirmarPago: (turno: TurnoAgenda) => void };

function AccionesTurno({ turno, onConfirmarPago }: PropsTurno) {
  const avisoId = useId();
  const { acciones } = turno;
  if (acciones.length === 0) return null;
  const hayPendientes = acciones.some((accion) => accion !== "CONFIRMAR_PAGO");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {acciones.map((accion) =>
          accion === "CONFIRMAR_PAGO" ? (
            <Button
              key={accion}
              variante="primario"
              className="h-8 px-2 text-xs"
              onClick={() => onConfirmarPago(turno)}
            >
              {ETIQUETA_ACCION[accion]}
            </Button>
          ) : (
            <Button
              key={accion}
              variante="secundario"
              disabled
              aria-describedby={avisoId}
              className="h-8 px-2 text-xs"
            >
              {ETIQUETA_ACCION[accion] ?? accion}
            </Button>
          ),
        )}
      </div>
      {hayPendientes && (
        <p id={avisoId} className="text-xs text-texto-suave">
          {AVISO_ACCIONES}
        </p>
      )}
    </div>
  );
}

function moverFecha(fecha: string, delta: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia + delta));
  const y = fechaUtc.getUTCFullYear();
  const m = String(fechaUtc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fechaUtc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function FilaTurno({ turno, onConfirmarPago }: PropsTurno) {
  const confirmadaConSaldo = turno.estado === "CONFIRMADA" && turno.saldoPendiente > 0;
  const confirmadaPagada = turno.estado === "CONFIRMADA" && turno.saldoPendiente === 0;

  return (
    <tr
      className={
        confirmadaConSaldo
          ? "border-l-2 border-alerta"
          : undefined
      }
    >
      <td className="px-3 py-2 tabular-nums">
        {turno.horaInicio}–{turno.horaFin}
      </td>
      <td className="px-3 py-2">{turno.cancha.nombre}</td>
      <td className="px-3 py-2">{turno.cliente.nombre}</td>
      <td className="px-3 py-2 tabular-nums">{turno.cliente.telefono}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <Badge tono={tonoEstado(turno.estado)}>{ETIQUETA_ESTADO[turno.estado]}</Badge>
          {confirmadaConSaldo && (
            <Badge tono="alerta">Saldo {moneda(turno.saldoPendiente)}</Badge>
          )}
          {confirmadaPagada && <Badge tono="exito">Pagada</Badge>}
        </div>
      </td>
      <td className="px-3 py-2 tabular-nums">{moneda(turno.adelantoPagado)}</td>
      <td className="px-3 py-2 tabular-nums">{moneda(turno.saldoPendiente)}</td>
      <td className="px-3 py-2">
        <AccionesTurno turno={turno} onConfirmarPago={onConfirmarPago} />
      </td>
    </tr>
  );
}

function TarjetaTurno({ turno, onConfirmarPago }: PropsTurno) {
  const confirmadaConSaldo = turno.estado === "CONFIRMADA" && turno.saldoPendiente > 0;
  const confirmadaPagada = turno.estado === "CONFIRMADA" && turno.saldoPendiente === 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="tabular-nums font-medium">
            {turno.horaInicio}–{turno.horaFin}
          </p>
          <p className="text-sm text-texto-suave">{turno.cancha.nombre}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <Badge tono={tonoEstado(turno.estado)}>{ETIQUETA_ESTADO[turno.estado]}</Badge>
          {confirmadaConSaldo && (
            <Badge tono="alerta">Saldo {moneda(turno.saldoPendiente)}</Badge>
          )}
          {confirmadaPagada && <Badge tono="exito">Pagada</Badge>}
        </div>
      </div>
      <div className="text-sm">
        <p className="font-medium">{turno.cliente.nombre}</p>
        <p className="text-texto-suave tabular-nums">{turno.cliente.telefono}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-texto-suave">Adelanto</dt>
          <dd className="tabular-nums">{moneda(turno.adelantoPagado)}</dd>
        </div>
        <div>
          <dt className="text-texto-suave">Saldo</dt>
          <dd className="tabular-nums">{moneda(turno.saldoPendiente)}</dd>
        </div>
      </dl>
      <AccionesTurno turno={turno} onConfirmarPago={onConfirmarPago} />
    </Card>
  );
}

export function PantallaAgenda() {
  const [fecha, setFecha] = useState<string | null>(null);
  const [canchaId, setCanchaId] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [porConfirmar, setPorConfirmar] = useState<TurnoAgenda | null>(null);
  const confirmarPago = useConfirmarPago();
  const toast = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFecha((actual) => actual ?? hoyEnLima());
  }, []);

  useTurnosEnVivo(fecha ?? "", [["agenda", fecha]]);

  const { data: turnos, isLoading, isError, error } = useAgenda(
    fecha ?? "",
    canchaId || undefined,
    estadoFiltro || undefined,
  );

  const canchas = useCanchas();

  const lista = [...(turnos ?? [])].sort((a, b) => {
    if (a.horaInicio !== b.horaInicio) return a.horaInicio.localeCompare(b.horaInicio);
    return a.cancha.nombre.localeCompare(b.cancha.nombre);
  });
  const totalTurnos = lista.filter((turno) => ESTADOS_DEL_DIA.includes(turno.estado)).length;
  const conSaldo = lista.filter(
    (turno) => ESTADOS_CON_SALDO.includes(turno.estado) && turno.saldoPendiente > 0,
  ).length;
  const pendientesPago = lista.filter(
    (turno) => turno.estado === "PENDIENTE_PAGO",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">
          Agenda de turnos
        </h1>
        <p className="text-sm text-texto-suave">
          Turnos del día {fecha ? fechaEnPantalla(fecha) : "…"}
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-3">
        <div className="flex items-end gap-2">
          <Button
            variante="secundario"
            aria-label="Día anterior"
            className="h-10 w-10 px-0"
            disabled={!fecha}
            onClick={() => setFecha((actual) => (actual ? moverFecha(actual, -1) : actual))}
          >
            ‹
          </Button>
          <CampoFecha
            etiqueta="Fecha"
            fecha={fecha ?? ""}
            disabled={!fecha}
            className="w-[150px]"
            onCambiar={setFecha}
          />
          <Button
            variante="secundario"
            aria-label="Día siguiente"
            className="h-10 w-10 px-0"
            disabled={!fecha}
            onClick={() => setFecha((actual) => (actual ? moverFecha(actual, 1) : actual))}
          >
            ›
          </Button>
          <Button
            variante="primario"
            onClick={() => setFecha(hoyEnLima())}
          >
            Hoy
          </Button>
        </div>

        <div className="min-w-[180px]">
          <Select
            etiqueta="Cancha"
            value={canchaId}
            onChange={(evento) => setCanchaId(evento.target.value)}
            ayuda={canchas.isError ? "No se pudo cargar la lista de canchas" : undefined}
          >
            <option value="">Todas las canchas</option>
            {canchas.data?.map((cancha) => (
              <option key={cancha.id} value={cancha.id}>
                {cancha.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[200px]">
          <Select
            etiqueta="Estado"
            value={estadoFiltro}
            onChange={(evento) => setEstadoFiltro(evento.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETA_ESTADO[estado]}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-texto-suave">Turnos del día</span>
          <span className="font-display text-[32px] font-bold tabular-nums">
            {totalTurnos}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-texto-suave">Con saldo pendiente</span>
          <span className="font-display text-[32px] font-bold tabular-nums">
            {conSaldo}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-texto-suave">Pendientes de pago</span>
          <span className="font-display text-[32px] font-bold tabular-nums">
            {pendientesPago}
          </span>
        </Card>
      </section>

      {isLoading && <p className="text-texto-suave">Cargando agenda…</p>}

      {isError && (
        <p className="text-error">
          {(error as Error)?.message ?? "No se pudo cargar la agenda"}
        </p>
      )}

      {!isLoading && !isError && lista.length === 0 && (
        <EmptyState mensaje="No hay reservas para este día" />
      )}

      {!isLoading && !isError && lista.length > 0 && (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-linea bg-superficie md:block">
            <table className="w-full text-sm">
              <thead className="text-texto-suave">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Horario</th>
                  <th className="px-3 py-2 text-left font-medium">Cancha</th>
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-left font-medium">Teléfono</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-left font-medium">Adelanto</th>
                  <th className="px-3 py-2 text-left font-medium">Saldo</th>
                  <th className="px-3 py-2 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((turno) => (
                  <FilaTurno key={turno.id} turno={turno} onConfirmarPago={setPorConfirmar} />
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-4 md:hidden">
            {lista.map((turno) => (
              <li key={turno.id}>
                <TarjetaTurno turno={turno} onConfirmarPago={setPorConfirmar} />
              </li>
            ))}
          </ul>
        </>
      )}

      {porConfirmar && (
        <ConfirmarPago
          key={porConfirmar.id}
          turno={porConfirmar}
          onCerrar={() => setPorConfirmar(null)}
          onEnviar={async ({ metodo, monto, numeroOperacion }) => {
            const confirmada = await confirmarPago.mutateAsync({
              id: porConfirmar.id,
              datos: { metodo, pagoCompleto: monto === "TOTAL", numeroOperacion },
            });
            setPorConfirmar(null);
            toast.exito(`Pago confirmado: la reserva ${confirmada.codigo} quedó confirmada`);
          }}
        />
      )}
    </div>
  );
}

export default PantallaAgenda;
