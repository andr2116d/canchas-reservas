import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [HorarioController],
  providers: [HorarioService],
  exports: [HorarioService],
})
export class HorarioModule {}
