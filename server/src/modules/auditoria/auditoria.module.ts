import { Module } from '@nestjs/common';
import { AccesosService } from './accesos.service';
import { AuditoriaService } from './auditoria.service';
import { ConsultaAuditoriaService } from './consulta-auditoria.service';

@Module({
  providers: [AuditoriaService, ConsultaAuditoriaService, AccesosService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
