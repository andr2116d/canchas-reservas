import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  HORARIO_REPOSITORY,
  type HorarioRepository,
  HorarioModule,
} from '../horario/api-horario';
import { ConsultarTarifasUseCase } from './aplicacion/consultar-tarifas.use-case';
import { DefinirTarifaUseCase } from './aplicacion/definir-tarifa.use-case';
import { SimularTurnosUseCase } from './aplicacion/simular-turnos.use-case';
import { TurnosDelDiaUseCase } from './aplicacion/turnos-del-dia.use-case';
import {
  TARIFA_REPOSITORY,
  type TarifaRepository,
} from './dominio/tarifa.repository';
import { TarifasController } from './infraestructura/http/tarifas.controller';
import { PrismaTarifaRepository } from './infraestructura/persistencia/prisma-tarifa.repository';

/** Tarifas por tipo de cancha y franja, y los turnos de cada día con su precio. */
@Module({
  imports: [HorarioModule],
  controllers: [TarifasController],
  providers: [
    { provide: TARIFA_REPOSITORY, useClass: PrismaTarifaRepository },
    {
      provide: SimularTurnosUseCase,
      useFactory: () => new SimularTurnosUseCase(),
    },
    {
      provide: DefinirTarifaUseCase,
      useFactory: (tarifas: TarifaRepository, reloj: Reloj) =>
        new DefinirTarifaUseCase(tarifas, reloj),
      inject: [TARIFA_REPOSITORY, RELOJ],
    },
    {
      provide: ConsultarTarifasUseCase,
      useFactory: (tarifas: TarifaRepository) =>
        new ConsultarTarifasUseCase(tarifas),
      inject: [TARIFA_REPOSITORY],
    },
    {
      provide: TurnosDelDiaUseCase,
      useFactory: (tarifas: TarifaRepository, horarios: HorarioRepository) =>
        new TurnosDelDiaUseCase(tarifas, horarios),
      inject: [TARIFA_REPOSITORY, HORARIO_REPOSITORY],
    },
  ],
  exports: [TARIFA_REPOSITORY],
})
export class TarifasModule {}
