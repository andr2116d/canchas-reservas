import { Module } from '@nestjs/common';
import { ReglaCancelacionModule } from '../regla-cancelacion/regla-cancelacion.module';
import { TarifasModule } from '../tarifas/tarifas.module';
import { TurnosModule } from '../turnos/turnos.module';
import { ReservasService } from './reservas.service';

@Module({
  imports: [TurnosModule, TarifasModule, ReglaCancelacionModule],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
