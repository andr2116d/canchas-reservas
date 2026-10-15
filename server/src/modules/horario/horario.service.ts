import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { Franja } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import {
  aMinutos,
  type DiaHorario,
  diaSemanaDe,
  generarTurnos,
} from '../turnos/generar-turnos';

export const INICIO_NOCHE_POR_DEFECTO = '18:00';
const ID_CONFIGURACION = 1;
const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7];

type Cliente = Prisma.TransactionClient | PrismaService;

export interface DiaDeHorario extends DiaHorario {
  diaSemana: number;
}

export interface Horario {
  dias: DiaDeHorario[];
  inicioNoche: string;
}

const diaCerrado = (diaSemana: number): DiaDeHorario => ({
  diaSemana,
  abierto: false,
  apertura: null,
  cierre: null,
});

@Injectable()
export class HorarioService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(cliente: Cliente = this.prisma): Promise<Horario> {
    const guardados = await cliente.horarioDia.findMany({
      select: { diaSemana: true, abierto: true, apertura: true, cierre: true },
    });
    const inicioNoche = await this.inicioNoche(cliente);
    const dias = DIAS_SEMANA.map(
      (diaSemana) =>
        guardados.find((dia) => dia.diaSemana === diaSemana) ??
        diaCerrado(diaSemana),
    );
    return { dias, inicioNoche };
  }

  async diaDe(fecha: string) {
    const diaSemana = diaSemanaDe(fecha);
    const dia = await this.prisma.horarioDia.findUnique({
      where: { diaSemana },
      select: { diaSemana: true, abierto: true, apertura: true, cierre: true },
    });
    return {
      dia: dia ?? diaCerrado(diaSemana),
      inicioNoche: await this.inicioNoche(),
    };
  }

  async franjaDe(hora: string): Promise<Franja> {
    const inicioNoche = await this.inicioNoche();
    return aMinutos(hora) >= aMinutos(inicioNoche) ? 'NOCHE' : 'DIA';
  }

  async vistaPrevia(fecha: string) {
    const { dia, inicioNoche } = await this.diaDe(fecha);
    return generarTurnos(dia, inicioNoche);
  }

  private async inicioNoche(cliente: Cliente = this.prisma) {
    const configuracion = await cliente.configuracion.findUnique({
      where: { id: ID_CONFIGURACION },
      select: { inicioNoche: true },
    });
    return configuracion?.inicioNoche ?? INICIO_NOCHE_POR_DEFECTO;
  }
}
