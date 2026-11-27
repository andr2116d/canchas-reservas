import Link from "next/link";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { enSoles } from "@/compartido/ui/textos-del-local";
import type { MiReserva } from "../servicios/reservas";
import { horaDelLocal, tiempoRestante } from "../utilidades/textos-de-la-reserva";

const TITULO_DEL_ESTADO: Record<MiReserva["estado"], string> = {
  PENDIENTE_DE_PAGO: "Turno separado",
  PENDIENTE_DE_VALIDACION: "Pago por validar",
  CONFIRMADA: "Reserva confirmada",
  EN_JUEGO: "En juego",
  EXPIRADA: "La reserva venció",
};

function Codigo({ codigo }: { codigo: string }) {
  return (
    <p className="flex flex-col">
      <span className="text-xs font-bold tracking-[0.18em] text-grava uppercase">Código de la reserva</span>
      <span className="font-titular text-5xl leading-none font-black tracking-[0.12em] text-cancha">{codigo}</span>
    </p>
  );
}

function PorPagar({ reserva, restantes }: { reserva: MiReserva; restantes: number }) {
  return (
    <>
      <p className="flex items-baseline justify-between gap-3 rounded-xl bg-capitan/35 px-4 py-3">
        <span className="text-sm font-bold">Queda guardado</span>
        <span role="timer" aria-label="Tiempo que queda" className="font-titular text-4xl leading-none font-black tabular-nums">{tiempoRestante(restantes)}</span>
      </p>
      <p className="text-sm text-grava">
        Si no se paga el adelanto antes de las {horaDelLocal(reserva.venceEn ?? reserva.inicio)}, el turno se libera solo y no se cobra nada.
      </p>
      <button type="button" disabled className={`${BOTON_PRINCIPAL} disabled:cursor-not-allowed`}>
        Pagar {enSoles(reserva.adelanto)} de adelanto
      </button>
      <p className="text-xs text-grava">El pago en línea llega pronto.</p>
    </>
  );
}

function Vencida() {
  return (
    <>
      <p>Pasó el tiempo para pagar el adelanto: el turno quedó libre otra vez y no se cobró nada.</p>
      <Link href="/inicio/reservar" className={BOTON_PRINCIPAL}>Reservar otro turno</Link>
    </>
  );
}

/** El código, en qué está la reserva y, si espera pago, cuánto falta para que se libere el turno. */
export function EstadoDeLaSeparacion({ reserva, restantes }: { reserva: MiReserva; restantes?: number }) {
  const vencida = reserva.estado === "EXPIRADA" || (reserva.estado === "PENDIENTE_DE_PAGO" && restantes === 0);
  return (
    <section aria-labelledby="titulo-estado" className={`${TARJETA} total-de-la-reserva flex flex-col gap-4`}>
      <h2 id="titulo-estado" className="font-titular text-3xl font-black text-cancha">
        {vencida ? TITULO_DEL_ESTADO.EXPIRADA : TITULO_DEL_ESTADO[reserva.estado]}
      </h2>
      <Codigo codigo={reserva.codigo} />
      {vencida && <Vencida />}
      {!vencida && reserva.estado === "PENDIENTE_DE_PAGO" && restantes !== undefined && <PorPagar reserva={reserva} restantes={restantes} />}
    </section>
  );
}
