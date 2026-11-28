import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { ConsultarHorarioUseCase } from './aplicacion/consultar-horario.use-case';
import {
  RESERVAS_POR_JUGAR,
  type ReservasPorJugar,
} from './aplicacion/reservas-por-jugar.port';
import { DefinirHorarioUseCase } from './aplicacion/definir-horario.use-case';
import {
  HORARIO_REPOSITORY,
  type HorarioRepository,
} from './dominio/horario.repository';
import { HorarioController } from './infraestructura/http/horario.controller';
import { PrismaHorarioRepository } from './infraestructura/persistencia/prisma-horario.repository';
import { PrismaReservasPorJugarAdapter } from './infraestructura/persistencia/prisma-reservas-por-jugar.adapter';

/** Horario de atención de la semana. Exporta su repositorio para calcular turnos y franjas. */
@Module({
  controllers: [HorarioController],
  providers: [
    { provide: HORARIO_REPOSITORY, useClass: PrismaHorarioRepository },
    { provide: RESERVAS_POR_JUGAR, useClass: PrismaReservasPorJugarAdapter },
    {
      provide: DefinirHorarioUseCase,
      useFactory: (
        horarios: HorarioRepository,
        reservas: ReservasPorJugar,
        reloj: Reloj,
      ) => new DefinirHorarioUseCase(horarios, reservas, reloj),
      inject: [HORARIO_REPOSITORY, RESERVAS_POR_JUGAR, RELOJ],
    },
    {
      provide: ConsultarHorarioUseCase,
      useFactory: (horarios: HorarioRepository) =>
        new ConsultarHorarioUseCase(horarios),
      inject: [HORARIO_REPOSITORY],
    },
  ],
  exports: [HORARIO_REPOSITORY],
})
export class HorarioModule {}
