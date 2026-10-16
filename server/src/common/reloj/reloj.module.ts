import { Global, Module } from '@nestjs/common';
import { Reloj } from './reloj';

@Global()
@Module({
  providers: [Reloj],
  exports: [Reloj],
})
export class RelojModule {}
