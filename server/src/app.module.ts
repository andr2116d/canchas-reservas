import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompartidoModule } from './compartido/compartido.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CompartidoModule],
})
export class AppModule {}
