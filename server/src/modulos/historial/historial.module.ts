import { Module } from '@nestjs/common';
import { ConsultarHistorialUseCase } from './aplicacion/consultar-historial.use-case';
import {
  HISTORIAL_REPOSITORY,
  type HistorialRepository,
} from './dominio/historial.repository';
import { HistorialController } from './infraestructura/http/historial.controller';
import { PrismaHistorialRepository } from './infraestructura/persistencia/prisma-historial.repository';

/** Historial de cambios de solo lectura, para administración. */
@Module({
  controllers: [HistorialController],
  providers: [
    { provide: HISTORIAL_REPOSITORY, useClass: PrismaHistorialRepository },
    {
      provide: ConsultarHistorialUseCase,
      useFactory: (historial: HistorialRepository) =>
        new ConsultarHistorialUseCase(historial),
      inject: [HISTORIAL_REPOSITORY],
    },
  ],
})
export class HistorialModule {}
