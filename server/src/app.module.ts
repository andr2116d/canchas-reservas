import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CompartidoModule } from './compartido/compartido.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';

// Límite general por IP; las rutas sensibles fijan uno más estricto.
const LIMITE_GENERAL = { ttl: 60 * 1000, limit: 100 };

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([LIMITE_GENERAL]),
    CompartidoModule,
    UsuariosModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
