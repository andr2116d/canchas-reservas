import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { Franja } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { detalleCambios } from '../auditoria/detalle-cambios';
import {
  aMinutos,
  type DiaHorario,
  diaSemanaDe,
  generarTurnos,
} from '../turnos/generar-turnos';
import { DiaHorarioDto } from './dto/dia-horario.dto';
import { GuardarHorarioDto } from './dto/guardar-horario.dto';

export const INICIO_NOCHE_POR_DEFECTO = '18:00';
const ENTIDAD = 'HORARIO';
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

function aDiaDeHorario({
  diaSemana,
  abierto,
  apertura,
  cierre,
}: DiaHorarioDto): DiaDeHorario {
  return abierto
    ? { diaSemana, abierto, apertura: apertura ?? null, cierre: cierre ?? null }
    : diaCerrado(diaSemana);
}

function mismoDia(a: DiaDeHorario, b: DiaDeHorario) {
  return (
    a.abierto === b.abierto &&
    a.apertura === b.apertura &&
    a.cierre === b.cierre
  );
}

@Injectable()
export class HorarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

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

  async guardar(
    { dias, inicioNoche }: GuardarHorarioDto,
    usuarioId: number,
  ): Promise<Horario> {
    const nuevos = DIAS_SEMANA.map((diaSemana) =>
      aDiaDeHorario(dias.find((dia) => dia.diaSemana === diaSemana)!),
    );
    const nuevo: Horario = { dias: nuevos, inicioNoche };

    return this.prisma.$transaction(async (tx) => {
      const actual = await this.obtener(tx);
      const cambiados = nuevos.filter(
        (dia, i) => !mismoDia(dia, actual.dias[i]),
      );
      const detalle = detalleCambios(
        {
          dias: cambiados.map((dia) => actual.dias[dia.diaSemana - 1]),
          inicioNoche: actual.inicioNoche,
        },
        { dias: cambiados, inicioNoche },
      );
      if (!detalle) return actual;

      for (const { diaSemana, ...dia } of cambiados) {
        await tx.horarioDia.upsert({
          where: { diaSemana },
          update: dia,
          create: { diaSemana, ...dia },
        });
      }
      if (inicioNoche !== actual.inicioNoche) {
        await tx.configuracion.upsert({
          where: { id: ID_CONFIGURACION },
          update: { inicioNoche },
          create: { id: ID_CONFIGURACION, inicioNoche },
        });
      }
      await this.auditoria.registrar(
        { usuarioId, accion: 'EDITAR', entidad: ENTIDAD, detalle },
        tx,
      );
      return nuevo;
    });
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
