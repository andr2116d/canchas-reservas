import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { HorarioService } from './horario.service';

@Module({
  imports: [AuditoriaModule],
  providers: [HorarioService],
  exports: [HorarioService],
})
export class HorarioModule {}
