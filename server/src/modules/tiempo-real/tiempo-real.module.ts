import { Global, Module } from '@nestjs/common';
import { TurnosGateway } from './turnos.gateway';

@Global()
@Module({
  providers: [TurnosGateway],
  exports: [TurnosGateway],
})
export class TiempoRealModule {}
