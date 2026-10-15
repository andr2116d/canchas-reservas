import { Module } from '@nestjs/common';
import { HorarioModule } from '../horario/horario.module';
import { TurnosService } from './turnos.service';

@Module({
  imports: [HorarioModule],
  providers: [TurnosService],
  exports: [TurnosService],
})
export class TurnosModule {}
