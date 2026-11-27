import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import {
  ESTADOS_QUE_OCUPAN,
  ocupaElTurno,
} from '../../dominio/estado-del-turno';
import type {
  BloqueoDelDia,
  CanchaConsultada,
  OcupacionDelDia,
  ReservaDelDia,
} from '../../aplicacion/ocupacion-del-dia.port';

/** Lee canchas, reservas y bloqueos para el mapa de turnos. Nunca lee titulares ni motivos. */
@Injectable()
export class PrismaOcupacionDelDiaAdapter implements OcupacionDelDia {
  constructor(private readonly prisma: PrismaService) {}

  canchasOperativas(): Promise<CanchaConsultada[]> {
    return this.prisma.cancha.findMany({
      where: { estado: 'OPERATIVA' },
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, tipo: true, tieneIluminacion: true },
    });
  }

  async entre(
    inicio: Date,
    fin: Date,
  ): Promise<{ reservas: ReservaDelDia[]; bloqueos: BloqueoDelDia[] }> {
    const [reservas, bloqueos] = await Promise.all([
      this.prisma.reserva.findMany({
        where: {
          inicio: { lt: fin },
          fin: { gt: inicio },
          estado: { in: [...ESTADOS_QUE_OCUPAN] },
        },
        select: {
          canchaId: true,
          inicio: true,
          fin: true,
          estado: true,
          venceEn: true,
        },
      }),
      this.prisma.bloqueoDeCancha.findMany({
        where: { inicio: { lt: fin }, fin: { gt: inicio } },
        select: { canchaId: true, inicio: true, fin: true, liberadoEn: true },
      }),
    ]);
    return {
      reservas: reservas.flatMap(({ estado, ...resto }) =>
        ocupaElTurno(estado) ? [{ ...resto, estado }] : [],
      ),
      // Un bloqueo liberado deja de contar desde que se liberó.
      bloqueos: bloqueos.map(({ canchaId, inicio, fin, liberadoEn }) => ({
        canchaId,
        inicio,
        fin: liberadoEn ?? fin,
      })),
    };
  }
}
