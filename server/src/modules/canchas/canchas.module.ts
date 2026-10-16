import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { CanchasController } from './canchas.controller';
import { CanchasService } from './canchas.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [CanchasController],
  providers: [CanchasService],
  exports: [CanchasService],
})
export class CanchasModule {}
