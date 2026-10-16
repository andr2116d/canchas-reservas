import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AdicionalesController } from './adicionales.controller';
import { AdicionalesService } from './adicionales.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [AdicionalesController],
  providers: [AdicionalesService],
  exports: [AdicionalesService],
})
export class AdicionalesModule {}
