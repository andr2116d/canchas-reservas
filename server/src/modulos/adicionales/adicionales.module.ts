import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { ConsultarAdicionalesUseCase } from './aplicacion/consultar-adicionales.use-case';
import { EditarAdicionalUseCase } from './aplicacion/editar-adicional.use-case';
import { EliminarAdicionalUseCase } from './aplicacion/eliminar-adicional.use-case';
import {
  DesactivarAdicionalUseCase,
  ReactivarAdicionalUseCase,
} from './aplicacion/estado-de-adicional.use-case';
import { RegistrarAdicionalUseCase } from './aplicacion/registrar-adicional.use-case';
import {
  USOS_DE_ADICIONAL,
  type UsosDeAdicional,
} from './aplicacion/usos-de-adicional.port';
import {
  ADICIONAL_REPOSITORY,
  type AdicionalRepository,
} from './dominio/adicional.repository';
import { AdicionalesController } from './infraestructura/http/adicionales.controller';
import { EstadoDeAdicionalController } from './infraestructura/http/estado-de-adicional.controller';
import { PrismaAdicionalRepository } from './infraestructura/persistencia/prisma-adicional.repository';
import { SinUsosAdapter } from './infraestructura/usos/sin-usos.adapter';

const CON_USOS = [ADICIONAL_REPOSITORY, USOS_DE_ADICIONAL, RELOJ];

/** Catálogo de adicionales que el local presta en la cancha y la auditoría de sus cambios. */
@Module({
  controllers: [AdicionalesController, EstadoDeAdicionalController],
  providers: [
    { provide: ADICIONAL_REPOSITORY, useClass: PrismaAdicionalRepository },
    { provide: USOS_DE_ADICIONAL, useClass: SinUsosAdapter },
    {
      provide: ConsultarAdicionalesUseCase,
      useFactory: (a: AdicionalRepository, u: UsosDeAdicional) =>
        new ConsultarAdicionalesUseCase(a, u),
      inject: [ADICIONAL_REPOSITORY, USOS_DE_ADICIONAL],
    },
    ...[
      RegistrarAdicionalUseCase,
      DesactivarAdicionalUseCase,
      ReactivarAdicionalUseCase,
    ].map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (a: AdicionalRepository, reloj: Reloj) =>
        new CasoDeUso(a, reloj),
      inject: [ADICIONAL_REPOSITORY, RELOJ],
    })),
    ...[EditarAdicionalUseCase, EliminarAdicionalUseCase].map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (a: AdicionalRepository, u: UsosDeAdicional, reloj: Reloj) =>
        new CasoDeUso(a, u, reloj),
      inject: CON_USOS,
    })),
  ],
})
export class AdicionalesModule {}
