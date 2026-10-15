import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ReglaCancelacionController } from './regla-cancelacion.controller';
import { ReglaCancelacionService } from './regla-cancelacion.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [ReglaCancelacionController],
  providers: [ReglaCancelacionService],
  exports: [ReglaCancelacionService],
})
export class ReglaCancelacionModule {}
