import { Module } from '@nestjs/common';
import { HorarioService } from './horario.service';

@Module({
  providers: [HorarioService],
  exports: [HorarioService],
})
export class HorarioModule {}
