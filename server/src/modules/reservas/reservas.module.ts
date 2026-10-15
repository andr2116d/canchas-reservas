import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ReglaCancelacionModule } from '../regla-cancelacion/regla-cancelacion.module';
import { TarifasModule } from '../tarifas/tarifas.module';
import { TurnosModule } from '../turnos/turnos.module';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [
    AuditoriaModule,
    TurnosModule,
    TarifasModule,
    ReglaCancelacionModule,
  ],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
