import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ReglaCancelacionModule } from '../regla-cancelacion/regla-cancelacion.module';
import { TarifasModule } from '../tarifas/tarifas.module';
import { TurnosModule } from '../turnos/turnos.module';
import { ReservasService } from './reservas.service';

@Module({
  imports: [
    AuditoriaModule,
    TurnosModule,
    TarifasModule,
    ReglaCancelacionModule,
  ],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
