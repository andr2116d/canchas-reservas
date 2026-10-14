import { Module } from '@nestjs/common';
import { ReglaCancelacionService } from './regla-cancelacion.service';

@Module({
  providers: [ReglaCancelacionService],
  exports: [ReglaCancelacionService],
})
export class ReglaCancelacionModule {}
