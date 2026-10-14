import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';

@Module({
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
