import { Module } from '@nestjs/common';
import { HorarioModule } from '../horario/horario.module';
import { DisponibilidadController } from './disponibilidad.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { TurnosService } from './turnos.service';

@Module({
  imports: [HorarioModule],
  controllers: [DisponibilidadController],
  providers: [TurnosService, DisponibilidadService],
  exports: [TurnosService],
})
export class TurnosModule {}
