import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SaludModule } from './modules/salud/salud.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, SaludModule],
})
export class AppModule {}
