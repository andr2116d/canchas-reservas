import { Injectable } from '@nestjs/common';
import { fechaEnLima } from '../../common/fechas-lima';
import { Reloj } from '../../common/reloj/reloj';
import { PrismaService } from '../../prisma/prisma.service';
import { CanchasService } from '../canchas/canchas.service';
import { aNumero } from '../tarifas/calculo-tarifa';
import { accionesAgenda } from './acciones-agenda';
import { ConsultarAgendaDto } from './dto/consultar-agenda.dto';
import { calcularMontosReserva, type PagoAprobado } from './montos-reserva';

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
    const pagos = await this.pagosAprobados(reservas.map((r) => r.id));

    return reservas.map(({ jugador, valorTurno, ...reserva }) => ({
      id: reserva.id,
      codigo: reserva.codigo,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      franja: reserva.franja,
      cancha: reserva.cancha,
      cliente: {
        id: jugador.id,
        nombre: [jugador.nombres, jugador.apellidos].filter(Boolean).join(' '),
        telefono: jugador.telefono,
      },
      estado: reserva.estado,
      valorTurno: aNumero(valorTurno),
      ...calcularMontosReserva(valorTurno, pagos.get(reserva.id) ?? []),
      acciones: accionesAgenda(reserva.estado),
    }));
  }

  private async pagosAprobados(reservaIds: number[]) {
    const porReserva = new Map<number, PagoAprobado[]>();
    if (reservaIds.length === 0) return porReserva;
    const sumas = await this.prisma.pago.groupBy({
      by: ['reservaId', 'concepto'],
      where: { reservaId: { in: reservaIds }, estado: 'APROBADO' },
      _sum: { monto: true },
    });
    for (const { reservaId, concepto, _sum } of sumas) {
      const lista = porReserva.get(reservaId) ?? [];
      lista.push({ concepto, monto: _sum.monto ?? 0 });
      porReserva.set(reservaId, lista);
    }
    return porReserva;
  }
}
