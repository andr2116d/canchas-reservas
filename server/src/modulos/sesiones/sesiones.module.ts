import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { AbrirSesionUseCase } from './aplicacion/abrir-sesion.use-case';
import { CerrarSesionUseCase } from './aplicacion/cerrar-sesion.use-case';
import { OmitirCambioDeContrasenaUseCase } from './aplicacion/omitir-cambio-de-contrasena.use-case';
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
import { SesionesController } from './infraestructura/http/sesiones.controller';
import { MisSesionesController } from './infraestructura/http/mis-sesiones.controller';
import { MisSesionesUseCase } from './aplicacion/mis-sesiones.use-case';
import { PanelesController } from './infraestructura/http/paneles.controller';
import { PrismaSesionRepository } from './infraestructura/persistencia/prisma-sesion.repository';
import { CryptoGeneradorTokenSesionAdapter } from './infraestructura/seguridad/crypto-generador-token-sesion.adapter';

const DEPENDENCIAS = [SESION_REPOSITORY, GENERADOR_TOKEN_SESION, RELOJ];

/** Sesiones de usuario y protección de todas las rutas privadas. */
@Module({
  controllers: [SesionesController, PanelesController, MisSesionesController],
  providers: [
    { provide: SESION_REPOSITORY, useClass: PrismaSesionRepository },
    {
      provide: MisSesionesUseCase,
      useFactory: (sesiones: SesionRepository, reloj: Reloj) =>
        new MisSesionesUseCase(sesiones, reloj),
      inject: [SESION_REPOSITORY, RELOJ],
    },
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
    {
      provide: CerrarSesionUseCase,
      useFactory: (
        sesiones: SesionRepository,
        generador: GeneradorTokenSesion,
      ) => new CerrarSesionUseCase(sesiones, generador),
      inject: [SESION_REPOSITORY, GENERADOR_TOKEN_SESION],
    },
    {
      provide: OmitirCambioDeContrasenaUseCase,
      useFactory: (sesiones: SesionRepository) =>
        new OmitirCambioDeContrasenaUseCase(sesiones),
      inject: [SESION_REPOSITORY],
    },
    { provide: APP_GUARD, useClass: SesionGuard },
  ],
  exports: [AbrirSesionUseCase],
})
export class SesionesModule {}
