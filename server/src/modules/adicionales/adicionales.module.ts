import { Module } from '@nestjs/common';
import { AdicionalesService } from './adicionales.service';

@Module({
  providers: [AdicionalesService],
  exports: [AdicionalesService],
})
export class AdicionalesModule {}
