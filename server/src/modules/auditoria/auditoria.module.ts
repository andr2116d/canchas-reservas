import { Module } from '@nestjs/common';
import { AccesosController } from './accesos.controller';
import { AccesosService } from './accesos.service';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { ConsultaAuditoriaService } from './consulta-auditoria.service';

@Module({
  controllers: [AuditoriaController, AccesosController],
  providers: [AuditoriaService, ConsultaAuditoriaService, AccesosService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
