import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { TarifasService } from './tarifas.service';

@Module({
  imports: [AuditoriaModule],
  providers: [TarifasService],
  exports: [TarifasService],
})
export class TarifasModule {}
