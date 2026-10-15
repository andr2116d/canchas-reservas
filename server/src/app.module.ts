import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RelojModule } from './common/reloj/reloj.module';
import { PrismaModule } from './prisma/prisma.module';
import { SaludModule } from './modules/salud/salud.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { CanchasModule } from './modules/canchas/canchas.module';
import { TarifasModule } from './modules/tarifas/tarifas.module';
import { HorarioModule } from './modules/horario/horario.module';
import { TurnosModule } from './modules/turnos/turnos.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { ReglaCancelacionModule } from './modules/regla-cancelacion/regla-cancelacion.module';
import { AdicionalesModule } from './modules/adicionales/adicionales.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RelojModule,
    SaludModule,
    AuthModule,
    UsuariosModule,
    AuditoriaModule,
    CanchasModule,
    TarifasModule,
    HorarioModule,
    TurnosModule,
    ReservasModule,
    ReglaCancelacionModule,
    AdicionalesModule,
  ],
})
export class AppModule {}
