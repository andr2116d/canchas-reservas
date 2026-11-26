import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../compartido/infraestructura/configuracion/configuracion';
import { PostgresEscucha } from '../../compartido/infraestructura/tiempo-real/postgres-escucha';
import { SesionesModule } from '../sesiones/api-sesiones';
import { AvisarUseCase } from './aplicacion/avisar.use-case';
import { MisAvisosUseCase } from './aplicacion/mis-avisos.use-case';
import { AVISO_REPOSITORY, type AvisoRepository } from './dominio/aviso';
import { AvisosController } from './infraestructura/http/avisos.controller';
import { PrismaAvisoRepository } from './infraestructura/persistencia/prisma-aviso.repository';
import { AvisosGateway } from './infraestructura/tiempo-real/avisos.gateway';
import {
  ESCUCHA_DE_AVISOS,
  RetransmisionDeAvisos,
} from './infraestructura/tiempo-real/retransmision-de-avisos';

/** Avisos de cada persona en su campana, en tiempo real. Otros módulos avisan con AvisarUseCase. */
@Module({
  imports: [SesionesModule],
  controllers: [AvisosController],
  providers: [
    { provide: AVISO_REPOSITORY, useClass: PrismaAvisoRepository },
    {
      provide: ESCUCHA_DE_AVISOS,
      useFactory: (c: Configuracion) =>
        new PostgresEscucha(c.urlBaseDeDatos, 'avisos'),
      inject: [CONFIGURACION],
    },
    ...[AvisarUseCase, MisAvisosUseCase].map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (avisos: AvisoRepository, reloj: Reloj) =>
        new CasoDeUso(avisos, reloj),
      inject: [AVISO_REPOSITORY, RELOJ],
    })),
    AvisosGateway,
    RetransmisionDeAvisos,
  ],
  exports: [AvisarUseCase],
})
export class AvisosModule {}
