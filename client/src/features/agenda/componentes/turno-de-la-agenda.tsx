import { NOMBRE_DEL_TIPO } from "@/compartido/canchas/tipo-de-cancha";
import { enSoles } from "@/compartido/ui/textos-del-local";
import { type EstadoDeReserva, NOMBRE_DEL_ESTADO, type TurnoDeLaAgenda } from "../servicios/agenda";
import { horaEnLima } from "../utilidades/fechas";
import { AccionesDelTurno } from "./acciones-del-turno";

const COLOR_DEL_ESTADO: Record<EstadoDeReserva, string> = {
  PENDIENTE_DE_PAGO: "bg-[#fbf1dc] text-[#7a4d00]",
  PENDIENTE_DE_VALIDACION: "bg-[#e6eefb] text-[#1d4fa3]",
  CONFIRMADA: "bg-[#e3f2e8] text-[#1f7a4d]",
  EN_JUEGO: "bg-cancha text-capitan",
  EXPIRADA: "bg-tiza text-grava",
};

/** Un celular de 9 dígitos se lee de tres en tres: «987 654 321». */
const celularLegible = (celular: string) => celular.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");

function Cliente({ cliente }: { cliente: TurnoDeLaAgenda["cliente"] }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-semibold text-tinta">{cliente.nombre}</span>
      {cliente.celular ? (
        <a href={`tel:+51${cliente.celular}`} className="w-fit text-sm text-botella tabular-nums underline-offset-4 hover:underline">
          {celularLegible(cliente.celular)}
        </a>
      ) : (
        <span className="text-sm text-grava">Sin celular</span>
      )}
    </span>
  );
}

function Estado({ turno }: { turno: TurnoDeLaAgenda }) {
  return (
    <span className="flex flex-col items-start gap-1">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${COLOR_DEL_ESTADO[turno.estado]}`}>{NOMBRE_DEL_ESTADO[turno.estado]}</span>
      {turno.venceEn && <span className="text-xs text-grava">Retiene el turno hasta las {horaEnLima(turno.venceEn)}</span>}
    </span>
  );
}

/** Lo pagado y el saldo. Una confirmada con saldo resalta cuánto falta cobrar; sin saldo, dice «Pagada». */
function Cobro({ turno }: { turno: TurnoDeLaAgenda }) {
  const confirmada = turno.estado === "CONFIRMADA";
  return (
    <span className="flex flex-col gap-1 text-sm">
      <dl className="grid grid-cols-[auto_auto] justify-start gap-x-3 tabular-nums">
        <dt className="text-grava">Pagado</dt>
        <dd className="text-right font-semibold text-tinta">{enSoles(turno.pagado)}</dd>
        <dt className="text-grava">Saldo</dt>
        <dd className="text-right font-semibold text-tinta">{enSoles(turno.saldo)}</dd>
      </dl>
      {confirmada && turno.pagada && <span className="w-fit rounded-full bg-[#e3f2e8] px-2.5 py-0.5 text-xs font-bold text-[#1f7a4d]">Pagada</span>}
      {confirmada && !turno.pagada && <span className="w-fit rounded-full bg-[#fbf1dc] px-2.5 py-0.5 text-xs font-bold text-[#7a4d00]">Falta cobrar {enSoles(turno.saldo)}</span>}
    </span>
  );
}

/** Una reserva del día: horario, cancha, cliente, estado, cobro y las acciones que su estado permite. */
export function TurnoDeLaAgenda({ turno }: { turno: TurnoDeLaAgenda }) {
  const conSaldo = turno.estado === "CONFIRMADA" && !turno.pagada;
  return (
    <li
      data-estado={turno.estado}
      className={`grid gap-x-5 gap-y-3 rounded-2xl border bg-papel px-4 py-3.5 shadow-sm sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] lg:grid-cols-[7.5rem_minmax(0,1fr)_10rem_10rem_auto] lg:items-center ${conSaldo ? "border-[#e8c97a]" : "border-white/80"} ${turno.estado === "EXPIRADA" ? "opacity-70" : ""}`}
    >
      <span className="flex flex-col">
        <span className="font-titular text-xl leading-none font-black text-cancha tabular-nums">{`${turno.desde}–${turno.hasta}`}</span>
        <span className="text-sm font-semibold text-tinta">{turno.cancha.nombre}</span>
        <span className="text-xs text-grava">{NOMBRE_DEL_TIPO[turno.cancha.tipo]} · {turno.codigo}</span>
      </span>
      <Cliente cliente={turno.cliente} />
      <Estado turno={turno} />
      <Cobro turno={turno} />
      <AccionesDelTurno turno={turno} />
    </li>
  );
}
