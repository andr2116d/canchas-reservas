import { Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { ConsultaAuditoriaService } from './consulta-auditoria.service';

@Module({
  providers: [AuditoriaService, ConsultaAuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
