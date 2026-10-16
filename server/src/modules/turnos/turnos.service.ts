import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HorarioService } from '../horario/horario.service';
import { generarTurnos, type Turno } from './generar-turnos';

@Injectable()
export class TurnosService {
  constructor(private readonly horario: HorarioService) {}

  async generar(
    fecha: string,
    cliente?: Prisma.TransactionClient | PrismaService,
  ): Promise<Turno[]> {
    const { dia, inicioNoche } = await this.horario.diaDe(fecha, cliente);
    return generarTurnos(dia, inicioNoche);
  }
}
