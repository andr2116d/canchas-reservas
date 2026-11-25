import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { CorreoModule } from '../correo/correo.module';
import { EnviarCorreoUseCase } from '../correo/aplicacion/enviar-correo.use-case';
import {
  DATOS_DEL_PROVEEDOR,
  type DatosDelProveedor,
} from './aplicacion/datos-del-proveedor.port';
import {
  GENERADOR_DE_CODIGO,
  type GeneradorDeCodigo,
} from './aplicacion/generador-de-codigo.port';
import { MisHojasUseCase } from './aplicacion/mis-hojas.use-case';
import { RegistrarHojaUseCase } from './aplicacion/registrar-hoja.use-case';
import { SeguirHojaUseCase } from './aplicacion/seguir-hoja.use-case';
import {
  HOJA_REPOSITORY,
  type HojaRepository,
} from './dominio/hoja.repository';
import { CryptoGeneradorDeCodigoAdapter } from './infraestructura/codigo/crypto-generador-de-codigo.adapter';
import { LibroDeReclamacionesController } from './infraestructura/http/libro-de-reclamaciones.controller';
import { MisHojasController } from './infraestructura/http/mis-hojas.controller';
import { PrismaHojaRepository } from './infraestructura/persistencia/prisma-hoja.repository';
import { SinDatosDelProveedorAdapter } from './infraestructura/proveedor/sin-datos-del-proveedor.adapter';

/** Libro de Reclamaciones virtual: registro público de hojas y su atención por administración. */
@Module({
  imports: [CorreoModule],
  controllers: [LibroDeReclamacionesController, MisHojasController],
  providers: [
    { provide: HOJA_REPOSITORY, useClass: PrismaHojaRepository },
    { provide: GENERADOR_DE_CODIGO, useClass: CryptoGeneradorDeCodigoAdapter },
    { provide: DATOS_DEL_PROVEEDOR, useClass: SinDatosDelProveedorAdapter },
    ...[SeguirHojaUseCase, MisHojasUseCase].map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (hojas: HojaRepository, reloj: Reloj) =>
        new CasoDeUso(hojas, reloj),
      inject: [HOJA_REPOSITORY, RELOJ],
    })),
    {
      provide: RegistrarHojaUseCase,
      useFactory: (
        ...[hojas, generador, proveedor, correos, reloj]: [
          HojaRepository,
          GeneradorDeCodigo,
          DatosDelProveedor,
          EnviarCorreoUseCase,
          Reloj,
        ]
      ) =>
        new RegistrarHojaUseCase({
          hojas,
          generador,
          proveedor,
          correos,
          reloj,
        }),
      inject: [
        HOJA_REPOSITORY,
        GENERADOR_DE_CODIGO,
        DATOS_DEL_PROVEEDOR,
        EnviarCorreoUseCase,
        RELOJ,
      ],
    },
  ],
})
export class ReclamosModule {}
