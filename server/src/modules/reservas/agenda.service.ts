import { Injectable } from '@nestjs/common';
import { fechaEnLima } from '../../common/fechas-lima';
import { Reloj } from '../../common/reloj/reloj';
import { PrismaService } from '../../prisma/prisma.service';
import { CanchasService } from '../canchas/canchas.service';
import { aNumero } from '../tarifas/calculo-tarifa';
import { accionesAgenda } from './acciones-agenda';
import { ConsultarAgendaDto } from './dto/consultar-agenda.dto';
import { calcularMontosReserva } from './montos-reserva';
import { pagosAprobadosPorReserva } from './pagos-aprobados';

@Injectable()
export class AgendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reloj: Reloj,
    private readonly canchas: CanchasService,
  ) {}

  async consultar({ fecha, canchaId, estado }: ConsultarAgendaDto) {
    const dia = fecha ?? fechaEnLima(this.reloj.ahora());
    if (canchaId !== undefined) await this.canchas.buscar(canchaId);

    const reservas = await this.prisma.reserva.findMany({
      where: {
        fecha: new Date(`${dia}T00:00:00.000Z`),
        canchaId,
        estado,
      },
      select: {
        id: true,
        codigo: true,
        horaInicio: true,
        horaFin: true,
        franja: true,
        estado: true,
        valorTurno: true,
        adelantoMinimo: true,
        cancha: { select: { id: true, nombre: true, tamano: true } },
        jugador: {
          select: { id: true, nombres: true, apellidos: true, telefono: true },
        },
      },
      orderBy: [
        { horaInicio: 'asc' },
        { cancha: { nombre: 'asc' } },
        { id: 'asc' },
      ],
    });
    const pagos = await pagosAprobadosPorReserva(
      this.prisma,
      reservas.map((r) => r.id),
    );

    return reservas.map(
      ({ jugador, valorTurno, adelantoMinimo, ...reserva }) => {
        const { adelantoPagado, saldoPendiente } = calcularMontosReserva(
          valorTurno,
          pagos.get(reserva.id) ?? [],
        );
        return {
          id: reserva.id,
          codigo: reserva.codigo,
          horaInicio: reserva.horaInicio,
          horaFin: reserva.horaFin,
          franja: reserva.franja,
          cancha: reserva.cancha,
          cliente: {
            id: jugador.id,
            nombre: [jugador.nombres, jugador.apellidos]
              .filter(Boolean)
              .join(' '),
            telefono: jugador.telefono,
          },
          estado: reserva.estado,
          valorTurno: aNumero(valorTurno),
          adelantoMinimo: aNumero(adelantoMinimo),
          adelantoPagado,
          saldoPendiente,
          acciones: accionesAgenda(reserva.estado),
        };
      },
    );
  }
}
