import { Module } from '@nestjs/common';
import { CanchasService } from './canchas.service';

@Module({
  providers: [CanchasService],
  exports: [CanchasService],
})
export class CanchasModule {}
