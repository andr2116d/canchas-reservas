import { BadRequestException, Injectable } from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import {
  fechaEnLima,
  instanteEnLima,
  sumarDias,
} from '../../common/fechas-lima';
import { Reloj } from '../../common/reloj/reloj';
import type { Prisma } from '../../generated/prisma/client';
import type {
  EstadoCancha,
  EstadoReserva,
  TamanoCancha,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { aNumero, calcularAdelanto } from '../tarifas/calculo-tarifa';
import { ConsultarDisponibilidadDto } from './dto/consultar-disponibilidad.dto';
import type { Turno } from './generar-turnos';
import { TurnosService } from './turnos.service';

export const DIAS_MAXIMOS_ANTICIPACION = 30;
export const MENSAJE_FUERA_DE_RANGO =
  'Solo puedes consultar desde hoy hasta 30 días después';

const ESTADOS_PENDIENTE: EstadoReserva[] = [
  'PENDIENTE_PAGO',
  'PENDIENTE_VALIDACION',
];
const ESTADOS_OCUPAN: EstadoReserva[] = [
  'CONFIRMADA',
  'EN_JUEGO',
  'FINALIZADA',
];
const ESTADOS_QUE_OCUPAN: EstadoReserva[] = [
  ...ESTADOS_PENDIENTE,
  ...ESTADOS_OCUPAN,
];

export type EstadoTurno =
  'DISPONIBLE' | 'PENDIENTE' | 'OCUPADO' | 'EN_MANTENIMIENTO';
export type MotivoTurno = 'PASADO' | 'SIN_TARIFA';

export interface TurnoDisponibilidad extends Turno {
  estado: EstadoTurno;
  seleccionable: boolean;
  motivo?: MotivoTurno;
  valor?: number;
  adelanto?: number;
}

interface CanchaDisponibilidad {
  id: number;
  nombre: string;
  tamano: TamanoCancha;
  iluminacion: boolean;
  turnos: TurnoDisponibilidad[];
}

export interface Disponibilidad {
  fecha: string;
  abierto: boolean;
  canchas: CanchaDisponibilidad[];
}

interface EstadoCanchaTurno {
  estadoCancha: EstadoCancha;
  turno: Turno;
  estadoReserva: EstadoReserva | undefined;
  valor: Prisma.Decimal | undefined;
  fecha: string;
  ahora: Date;
}

const CAMPOS_CANCHA = {
  id: true,
  nombre: true,
  tamano: true,
  iluminacion: true,
  estado: true,
} as const;

/**
 * Los turnos del día salen del horario, y las reservas y tarifas vigentes se
 * leen una vez cada una. Todo el cruce se hace en memoria: nunca una consulta
 * por turno.
 */
@Injectable()
export class DisponibilidadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reloj: Reloj,
    private readonly turnos: TurnosService,
  ) {}

  async consultar({
    fecha,
    canchaId,
  }: ConsultarDisponibilidadDto): Promise<Disponibilidad> {
    const ahora = this.reloj.ahora();
    this.validarFecha(fecha, ahora);

    const [turnosDelDia, canchas] = await Promise.all([
      this.turnos.generar(fecha),
      this.prisma.cancha.findMany({
        where: {
          activa: true,
          ...(canchaId === undefined ? {} : { id: canchaId }),
        },
        select: CAMPOS_CANCHA,
        orderBy: { nombre: 'asc' },
      }),
    ]);

    // El horario manda: si no hay turnos, el día está cerrado y no hay nada que cruzar.
    if (turnosDelDia.length === 0) {
      const sinTurnos: CanchaDisponibilidad[] = canchas.map(
        ({ estado: _estado, ...datos }) => ({ ...datos, turnos: [] }),
      );
      return { fecha, abierto: false, canchas: sinTurnos };
    }

    const [reservas, tarifas] = await Promise.all([
      this.prisma.reserva.findMany({
        where: {
          fecha: new Date(`${fecha}T00:00:00.000Z`),
          estado: { in: ESTADOS_QUE_OCUPAN },
        },
        select: { canchaId: true, horaInicio: true, estado: true },
      }),
      this.prisma.tarifa.findMany({
        where: { vigenteHasta: null },
        select: { canchaId: true, franja: true, valor: true },
      }),
    ]);

    const reservaPorTurno = new Map(
      reservas.map((r) => [`${r.canchaId}-${r.horaInicio}`, r.estado]),
    );
    const tarifaPorCancha = new Map(
      tarifas.map((t) => [`${t.canchaId}-${t.franja}`, t.valor]),
    );

    return {
      fecha,
      abierto: true,
      canchas: canchas.map(({ estado, ...datos }) => ({
        ...datos,
        turnos: turnosDelDia.map((turno) =>
          this.estadoDelTurno({
            estadoCancha: estado,
            turno,
            estadoReserva: reservaPorTurno.get(
              `${datos.id}-${turno.horaInicio}`,
            ),
            valor: tarifaPorCancha.get(`${datos.id}-${turno.franja}`),
            fecha,
            ahora,
          }),
        ),
      })),
    };
  }

  private estadoDelTurno({
    estadoCancha,
    turno,
    estadoReserva,
    valor,
    fecha,
    ahora,
  }: EstadoCanchaTurno): TurnoDisponibilidad {
    if (estadoCancha === 'EN_MANTENIMIENTO') {
      return { ...turno, estado: 'EN_MANTENIMIENTO', seleccionable: false };
    }
    if (estadoReserva && ESTADOS_PENDIENTE.includes(estadoReserva)) {
      return { ...turno, estado: 'PENDIENTE', seleccionable: false };
    }
    if (estadoReserva && ESTADOS_OCUPAN.includes(estadoReserva)) {
      return { ...turno, estado: 'OCUPADO', seleccionable: false };
    }
    if (
      fecha === fechaEnLima(ahora) &&
      instanteEnLima(fecha, turno.horaInicio) <= ahora
    ) {
      return {
        ...turno,
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'PASADO',
      };
    }
    if (valor === undefined) {
      return {
        ...turno,
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'SIN_TARIFA',
      };
    }
    return {
      ...turno,
      estado: 'DISPONIBLE',
      seleccionable: true,
      valor: aNumero(valor),
      adelanto: aNumero(calcularAdelanto(valor)),
    };
  }

  private validarFecha(fecha: string, ahora: Date) {
    const hoy = fechaEnLima(ahora);
    const limite = sumarDias(hoy, DIAS_MAXIMOS_ANTICIPACION);
    if (fecha < hoy || fecha > limite) {
      throw new BadRequestException(
        cuerpoError(400, MENSAJE_FUERA_DE_RANGO, {
          fecha: MENSAJE_FUERA_DE_RANGO,
        }),
      );
    }
  }
}
