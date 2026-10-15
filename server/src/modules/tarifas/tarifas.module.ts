import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { TarifasController } from './tarifas.controller';
import { TarifasService } from './tarifas.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [TarifasController],
  providers: [TarifasService],
  exports: [TarifasService],
})
export class TarifasModule {}
