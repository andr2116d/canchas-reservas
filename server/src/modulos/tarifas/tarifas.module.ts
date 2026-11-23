import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { CalcularValorDelTurnoUseCase } from './aplicacion/calcular-valor-del-turno.use-case';
import { ConsultarTarifasUseCase } from './aplicacion/consultar-tarifas.use-case';
import { DefinirTarifaUseCase } from './aplicacion/definir-tarifa.use-case';
import {
  HORARIO_DE_FRANJAS,
  type HorarioDeFranjas,
} from './aplicacion/horario-de-franjas.port';
import {
  TARIFA_REPOSITORY,
  type TarifaRepository,
} from './dominio/tarifa.repository';
import { HorarioFijoDeFranjasAdapter } from './infraestructura/horario/horario-fijo-de-franjas.adapter';
import { TarifasController } from './infraestructura/http/tarifas.controller';
import { PrismaTarifaRepository } from './infraestructura/persistencia/prisma-tarifa.repository';

/** Tarifas por tipo de cancha y franja, y el cálculo del valor de un turno. */
@Module({
  controllers: [TarifasController],
  providers: [
    { provide: TARIFA_REPOSITORY, useClass: PrismaTarifaRepository },
    { provide: HORARIO_DE_FRANJAS, useClass: HorarioFijoDeFranjasAdapter },
    {
      provide: DefinirTarifaUseCase,
      useFactory: (tarifas: TarifaRepository, reloj: Reloj) =>
        new DefinirTarifaUseCase(tarifas, reloj),
      inject: [TARIFA_REPOSITORY, RELOJ],
    },
    ...[ConsultarTarifasUseCase, CalcularValorDelTurnoUseCase].map(
      (CasoDeUso) => ({
        provide: CasoDeUso,
        useFactory: (tarifas: TarifaRepository, horario: HorarioDeFranjas) =>
          new CasoDeUso(tarifas, horario),
        inject: [TARIFA_REPOSITORY, HORARIO_DE_FRANJAS],
      }),
    ),
  ],
})
export class TarifasModule {}
