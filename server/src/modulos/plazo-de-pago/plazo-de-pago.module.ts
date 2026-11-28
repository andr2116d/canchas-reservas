import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { ConsultarPlazoDePagoUseCase } from './aplicacion/consultar-plazo-de-pago.use-case';
import { DefinirPlazoDePagoUseCase } from './aplicacion/definir-plazo-de-pago.use-case';
import { PlazoVigenteUseCase } from './aplicacion/plazo-vigente.use-case';
import {
  PLAZO_DE_PAGO_REPOSITORY,
  type PlazoDePagoRepository,
} from './dominio/plazo-de-pago.repository';
import { PlazoDePagoController } from './infraestructura/http/plazo-de-pago.controller';
import { PrismaPlazoDePagoRepository } from './infraestructura/persistencia/prisma-plazo-de-pago.repository';

/** Plazo para pagar el adelanto, su historial y el que rige para las reservas nuevas. */
@Module({
  controllers: [PlazoDePagoController],
  providers: [
    {
      provide: PLAZO_DE_PAGO_REPOSITORY,
      useClass: PrismaPlazoDePagoRepository,
    },
    {
      provide: DefinirPlazoDePagoUseCase,
      useFactory: (plazos: PlazoDePagoRepository, reloj: Reloj) =>
        new DefinirPlazoDePagoUseCase(plazos, reloj),
      inject: [PLAZO_DE_PAGO_REPOSITORY, RELOJ],
    },
    {
      provide: ConsultarPlazoDePagoUseCase,
      useFactory: (plazos: PlazoDePagoRepository) =>
        new ConsultarPlazoDePagoUseCase(plazos),
      inject: [PLAZO_DE_PAGO_REPOSITORY],
    },
    {
      provide: PlazoVigenteUseCase,
      useFactory: (plazos: PlazoDePagoRepository) =>
        new PlazoVigenteUseCase(plazos),
      inject: [PLAZO_DE_PAGO_REPOSITORY],
    },
  ],
  exports: [PlazoVigenteUseCase],
})
export class PlazoDePagoModule {}
