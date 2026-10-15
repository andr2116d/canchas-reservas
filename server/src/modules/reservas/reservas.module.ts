import { Module } from '@nestjs/common';
import { TarifasModule } from '../tarifas/tarifas.module';
import { TurnosModule } from '../turnos/turnos.module';
import { ReservasService } from './reservas.service';

@Module({
  imports: [TurnosModule, TarifasModule],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
