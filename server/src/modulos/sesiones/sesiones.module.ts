import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { AbrirSesionUseCase } from './aplicacion/abrir-sesion.use-case';
import {
  GENERADOR_TOKEN_SESION,
  type GeneradorTokenSesion,
} from './aplicacion/generador-token-sesion.port';
import { ValidarSesionUseCase } from './aplicacion/validar-sesion.use-case';
import {
  SESION_REPOSITORY,
  type SesionRepository,
} from './dominio/sesion.repository';
import { SesionGuard } from './infraestructura/http/sesion.guard';
import { PrismaSesionRepository } from './infraestructura/persistencia/prisma-sesion.repository';
import { CryptoGeneradorTokenSesionAdapter } from './infraestructura/seguridad/crypto-generador-token-sesion.adapter';

const DEPENDENCIAS = [SESION_REPOSITORY, GENERADOR_TOKEN_SESION, RELOJ];

/** Sesiones de usuario y protección de todas las rutas privadas. */
@Module({
  providers: [
    { provide: SESION_REPOSITORY, useClass: PrismaSesionRepository },
    {
      provide: GENERADOR_TOKEN_SESION,
      useClass: CryptoGeneradorTokenSesionAdapter,
    },
    {
      provide: AbrirSesionUseCase,
      useFactory: (
        sesiones: SesionRepository,
        generador: GeneradorTokenSesion,
        reloj: Reloj,
      ) => new AbrirSesionUseCase(sesiones, generador, reloj),
      inject: DEPENDENCIAS,
    },
    {
      provide: ValidarSesionUseCase,
      useFactory: (
        sesiones: SesionRepository,
        generador: GeneradorTokenSesion,
        reloj: Reloj,
      ) => new ValidarSesionUseCase(sesiones, generador, reloj),
      inject: DEPENDENCIAS,
    },
    { provide: APP_GUARD, useClass: SesionGuard },
  ],
  exports: [AbrirSesionUseCase],
})
export class SesionesModule {}
