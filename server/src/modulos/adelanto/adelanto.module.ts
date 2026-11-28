import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { ConsultarAdelantoUseCase } from './aplicacion/consultar-adelanto.use-case';
import { DefinirAdelantoUseCase } from './aplicacion/definir-adelanto.use-case';
import {
  ADELANTO_REPOSITORY,
  type AdelantoRepository,
} from './dominio/adelanto.repository';
import { AdelantoController } from './infraestructura/http/adelanto.controller';
import { PrismaAdelantoRepository } from './infraestructura/persistencia/prisma-adelanto.repository';
import {
  VENTANAS_DE_LLEGADA,
  VentanaDeLlegadaUseCase,
} from './aplicacion/ventana-de-llegada.use-case';
import { VentanaDeLlegadaController } from './infraestructura/http/ventana-de-llegada.controller';
import { PrismaVentanasDeLlegadaAdapter } from './infraestructura/persistencia/prisma-ventanas-de-llegada.adapter';

/** Adelanto mínimo del local y su historial. */
@Module({
  controllers: [AdelantoController, VentanaDeLlegadaController],
  providers: [
    { provide: ADELANTO_REPOSITORY, useClass: PrismaAdelantoRepository },
    { provide: VENTANAS_DE_LLEGADA, useClass: PrismaVentanasDeLlegadaAdapter },
    VentanaDeLlegadaUseCase,
    {
      provide: DefinirAdelantoUseCase,
      useFactory: (adelantos: AdelantoRepository, reloj: Reloj) =>
        new DefinirAdelantoUseCase(adelantos, reloj),
      inject: [ADELANTO_REPOSITORY, RELOJ],
    },
    {
      provide: ConsultarAdelantoUseCase,
      useFactory: (adelantos: AdelantoRepository) =>
        new ConsultarAdelantoUseCase(adelantos),
      inject: [ADELANTO_REPOSITORY],
    },
  ],
  exports: [ADELANTO_REPOSITORY],
})
export class AdelantoModule {}
