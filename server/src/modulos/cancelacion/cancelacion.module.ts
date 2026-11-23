import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { ConsultarReglaDeCancelacionUseCase } from './aplicacion/consultar-regla-de-cancelacion.use-case';
import { DefinirReglaDeCancelacionUseCase } from './aplicacion/definir-regla-de-cancelacion.use-case';
import { SimularCancelacionUseCase } from './aplicacion/simular-cancelacion.use-case';
import {
  REGLA_DE_CANCELACION_REPOSITORY,
  type ReglaDeCancelacionRepository,
} from './dominio/regla-de-cancelacion.repository';
import { ReglaDeCancelacionController } from './infraestructura/http/regla-de-cancelacion.controller';
import { PrismaReglaDeCancelacionRepository } from './infraestructura/persistencia/prisma-regla-de-cancelacion.repository';

/** Regla de cancelación del local, su historial y el cálculo de la compensación. */
@Module({
  controllers: [ReglaDeCancelacionController],
  providers: [
    {
      provide: REGLA_DE_CANCELACION_REPOSITORY,
      useClass: PrismaReglaDeCancelacionRepository,
    },
    {
      provide: DefinirReglaDeCancelacionUseCase,
      useFactory: (reglas: ReglaDeCancelacionRepository, reloj: Reloj) =>
        new DefinirReglaDeCancelacionUseCase(reglas, reloj),
      inject: [REGLA_DE_CANCELACION_REPOSITORY, RELOJ],
    },
    {
      provide: ConsultarReglaDeCancelacionUseCase,
      useFactory: (reglas: ReglaDeCancelacionRepository) =>
        new ConsultarReglaDeCancelacionUseCase(reglas),
      inject: [REGLA_DE_CANCELACION_REPOSITORY],
    },
    {
      provide: SimularCancelacionUseCase,
      useFactory: () => new SimularCancelacionUseCase(),
    },
  ],
})
export class CancelacionModule {}
