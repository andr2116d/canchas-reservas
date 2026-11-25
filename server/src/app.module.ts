import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { leerLimiteGeneral } from './compartido/infraestructura/configuracion/configuracion';
import { CompartidoModule } from './compartido/compartido.module';
import { AdelantoModule } from './modulos/adelanto/adelanto.module';
import { CancelacionModule } from './modulos/cancelacion/cancelacion.module';
import { AdicionalesModule } from './modulos/adicionales/adicionales.module';
import { CanchasModule } from './modulos/canchas/canchas.module';
import { ClubModule } from './modulos/club/club.module';
import { CorreoModule } from './modulos/correo/correo.module';
import { DisponibilidadModule } from './modulos/disponibilidad/disponibilidad.module';
import { HistorialModule } from './modulos/historial/historial.module';
import { HorarioModule } from './modulos/horario/horario.module';
import { ReclamosModule } from './modulos/reclamos/reclamos.module';
import { TarifasModule } from './modulos/tarifas/tarifas.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';

// Límite general por IP; las rutas sensibles fijan uno más estricto.
const LIMITE_GENERAL = {
  ttl: 60 * 1000,
  limit: () => leerLimiteGeneral(process.env),
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([LIMITE_GENERAL]),
    CompartidoModule,
    CorreoModule,
    UsuariosModule,
    HorarioModule,
    TarifasModule,
    CancelacionModule,
    AdelantoModule,
    CanchasModule,
    AdicionalesModule,
    HistorialModule,
    DisponibilidadModule,
    ClubModule,
    ReclamosModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
