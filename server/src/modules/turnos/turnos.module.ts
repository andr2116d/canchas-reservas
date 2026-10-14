import { Module } from '@nestjs/common';
import { TurnosService } from './turnos.service';

@Module({
  providers: [TurnosService],
  exports: [TurnosService],
})
export class TurnosModule {}
