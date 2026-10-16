import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { CanchasModule } from '../canchas/canchas.module';
import { ReglaCancelacionModule } from '../regla-cancelacion/regla-cancelacion.module';
import { TarifasModule } from '../tarifas/tarifas.module';
import { TurnosModule } from '../turnos/turnos.module';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { PagosReservaService } from './pagos-reserva.service';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [
    AuditoriaModule,
    CanchasModule,
    TurnosModule,
    TarifasModule,
    ReglaCancelacionModule,
  ],
  controllers: [ReservasController, AgendaController],
  providers: [ReservasService, AgendaService, PagosReservaService],
  exports: [ReservasService],
})
export class ReservasModule {}
