import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import {
  fechaEnLima,
  horaEnLima,
  momentoEnLima,
} from '../../../compartido/dominio/momento-en-lima';
import { limitesDeLlegada } from '../../adelanto/api-adelanto';
import { fechasConsultables } from '../../disponibilidad/api-disponibilidad';
import {
  type AccionDeLaAgenda,
  accionesPermitidas,
} from '../dominio/acciones-de-la-agenda';
import {
  type DatosDeLaAgenda,
  ESTADOS_DE_RESERVA,
  leerFiltroDeLaAgenda,
} from '../dominio/filtro-de-la-agenda';
import { estadoALaVista, horaDeFin } from '../dominio/reserva-a-la-vista';
import type { EstadoDeReserva } from '../dominio/reserva.repository';
import type {
  AgendaDelLocal,
  CanchaDeLaAgenda,
  ReservaDeLaAgenda,
} from './agenda-del-local.port';
import type { PagosDeReservas } from './pagos-de-reservas.port';

/** Un turno reservado tal como lo ve recepción, con lo que falta cobrar. */
export interface TurnoDeLaAgenda {
  codigo: string;
  estado: EstadoDeReserva;
  desde: string;
  hasta: string;
  cancha: CanchaDeLaAgenda;
  cliente: ReservaDeLaAgenda['cliente'];
  precio: string;
  adelanto: string;
  pagado: string;
  saldo: string;
  /** Sin saldo por cobrar. */
  pagada: boolean;
  /** Hasta cuándo retiene el turno sin pago; vacío si ya no espera pago. */
  venceEn: Date | null;
  acciones: AccionDeLaAgenda[];
}

/** La agenda de un día, con la hora del server y cuándo vuelve a cambiar sola. */
export interface AgendaDelDia {
  fecha: string;
  hoy: string;
  ultimaFecha: string;
  ahora: Date;
  proximoCambio: Date | null;
  canchas: CanchaDeLaAgenda[];
  conteos: Record<EstadoDeReserva, number>;
  turnos: TurnoDeLaAgenda[];
}

const SIN_PAGOS = Monto.desdeCentimos(0);

const porHoraYCancha = (a: ReservaDeLaAgenda, b: ReservaDeLaAgenda) =>
  a.inicio.getTime() - b.inicio.getTime() || a.cancha.id - b.cancha.id;

function contarPorEstado(turnos: TurnoDeLaAgenda[]) {
  const conteos = Object.fromEntries(
    ESTADOS_DE_RESERVA.map((estado) => [estado, 0]),
  ) as Record<EstadoDeReserva, number>;
  for (const { estado } of turnos) conteos[estado] += 1;
  return conteos;
}

function aTurno(
  reserva: ReservaDeLaAgenda,
  pagado: Monto,
  ahora: Date,
  checkInDisponible: boolean,
): TurnoDeLaAgenda {
  const estado = estadoALaVista(reserva, ahora);
  const saldo = Math.max(reserva.precio.centimos - pagado.centimos, 0);
  return {
    codigo: reserva.codigo,
    estado,
    desde: horaEnLima(reserva.inicio),
    hasta: horaDeFin(reserva),
    cancha: reserva.cancha,
    cliente: reserva.cliente,
    precio: reserva.precio.enSoles(),
    adelanto: reserva.adelanto.enSoles(),
    pagado: pagado.enSoles(),
    saldo: Monto.desdeCentimos(saldo).enSoles(),
    pagada: saldo === 0,
    venceEn: estado === 'PENDIENTE_DE_PAGO' ? reserva.venceEn : null,
    acciones: accionesPermitidas(estado).filter(
      (accion) => accion !== 'CHECK_IN' || checkInDisponible,
    ),
  };
}

/** Los turnos reservados de un día para recepción y administración, con filtros por cancha y estado. */
export class ConsultarAgendaUseCase {
  constructor(
    private readonly agenda: AgendaDelLocal,
    private readonly pagos: PagosDeReservas,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDeLaAgenda,
    puedeHacerCheckIn = false,
  ): Promise<AgendaDelDia> {
    const ahora = this.reloj.ahora();
    const { hoy, ultimaFecha } = fechasConsultables(ahora);
    const canchas = await this.agenda.canchas();
    const filtro = leerFiltroDeLaAgenda(datos, {
      hoy,
      ultimaFecha,
      canchaIds: canchas.map((c) => c.id),
    });
    const { turnos, proximoCambio } = await this.turnosDe(
      filtro.fecha,
      ahora,
      puedeHacerCheckIn,
      filtro.canchaId,
    );
    return {
      fecha: filtro.fecha,
      hoy,
      ultimaFecha,
      ahora,
      proximoCambio,
      canchas,
      conteos: contarPorEstado(turnos),
      turnos: filtro.estado
        ? turnos.filter((t) => t.estado === filtro.estado)
        : turnos,
    };
  }

  private async turnosDe(
    fecha: string,
    ahora: Date,
    puedeHacerCheckIn: boolean,
    canchaId?: number,
  ) {
    const reservas = (
      await this.agenda.reservasDelDia(
        momentoEnLima(fecha, '00:00'),
        momentoEnLima(fecha, '24:00'),
      )
    )
      .filter((r) => canchaId === undefined || r.cancha.id === canchaId)
      .sort(porHoraYCancha);
    const pagos = await this.pagos.pagadoPor(reservas.map((r) => r.id));
    const cambios: number[] = [];
    const habilitarHoy = puedeHacerCheckIn && fecha === fechaEnLima(ahora);
    const turnos = reservas.map((reserva) => {
      const ventana =
        habilitarHoy && reserva.estado === 'CONFIRMADA'
          ? limitesDeLlegada(
              reserva.inicio,
              reserva.ventanaDeLlegada ?? undefined,
            )
          : undefined;
      const disponible =
        ventana !== undefined &&
        ahora >= ventana.desde &&
        ahora <= ventana.hasta;
      if (ventana && ahora < ventana.desde)
        cambios.push(ventana.desde.getTime());
      if (ventana && disponible) cambios.push(ventana.hasta.getTime() + 1);
      const turno = aTurno(
        reserva,
        pagos.get(reserva.id) ?? SIN_PAGOS,
        ahora,
        disponible,
      );
      if (turno.venceEn) cambios.push(turno.venceEn.getTime());
      return turno;
    });
    return {
      turnos,
      proximoCambio: cambios.length ? new Date(Math.min(...cambios)) : null,
    };
  }
}
