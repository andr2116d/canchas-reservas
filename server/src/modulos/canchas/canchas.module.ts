import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import { ConsultarCanchasUseCase } from './aplicacion/consultar-canchas.use-case';
import { DesactivarCanchaUseCase } from './aplicacion/desactivar-cancha.use-case';
import { EditarCanchaUseCase } from './aplicacion/editar-cancha.use-case';
import { EliminarCanchaUseCase } from './aplicacion/eliminar-cancha.use-case';
import { ReactivarCanchaUseCase } from './aplicacion/reactivar-cancha.use-case';
import { RegistrarCanchasUseCase } from './aplicacion/registrar-canchas.use-case';
import {
  RESERVAS_DE_CANCHA,
  type ReservasDeCancha,
} from './aplicacion/reservas-de-cancha.port';
import {
  CANCHA_REPOSITORY,
  type CanchaRepository,
} from './dominio/cancha.repository';
import { BloquearCanchasUseCase } from './aplicacion/bloquear-canchas.use-case';
import { ConsultarBloqueosUseCase } from './aplicacion/consultar-bloqueos.use-case';
import { LiberarBloqueoUseCase } from './aplicacion/liberar-bloqueo.use-case';
import { QuitarBloqueoUseCase } from './aplicacion/quitar-bloqueo.use-case';
import {
  BLOQUEO_REPOSITORY,
  type BloqueoRepository,
} from './dominio/bloqueo.repository';
import { BloqueosController } from './infraestructura/http/bloqueos.controller';
import { CanchasController } from './infraestructura/http/canchas.controller';
import { EstadoDeCanchaController } from './infraestructura/http/estado-de-cancha.controller';
import { PrismaBloqueoRepository } from './infraestructura/persistencia/prisma-bloqueo.repository';
import { PrismaCanchaRepository } from './infraestructura/persistencia/prisma-cancha.repository';
import { SinReservasAdapter } from './infraestructura/reservas/sin-reservas.adapter';

const CON_RESERVAS = [CANCHA_REPOSITORY, RESERVAS_DE_CANCHA, RELOJ];

/** Canchas del local, sus características, su estado, sus bloqueos por mantenimiento y la auditoría de sus cambios. */
@Module({
  controllers: [
    CanchasController,
    EstadoDeCanchaController,
    BloqueosController,
  ],
  providers: [
    { provide: CANCHA_REPOSITORY, useClass: PrismaCanchaRepository },
    { provide: RESERVAS_DE_CANCHA, useClass: SinReservasAdapter },
    { provide: BLOQUEO_REPOSITORY, useClass: PrismaBloqueoRepository },
    {
      provide: BloquearCanchasUseCase,
      useFactory: (
        canchas: CanchaRepository,
        bloqueos: BloqueoRepository,
        reservas: ReservasDeCancha,
        reloj: Reloj,
      ) => new BloquearCanchasUseCase({ canchas, bloqueos, reservas, reloj }),
      inject: [
        CANCHA_REPOSITORY,
        BLOQUEO_REPOSITORY,
        RESERVAS_DE_CANCHA,
        RELOJ,
      ],
    },
    ...[
      ConsultarBloqueosUseCase,
      LiberarBloqueoUseCase,
      QuitarBloqueoUseCase,
    ].map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (bloqueos: BloqueoRepository, reloj: Reloj) =>
        new CasoDeUso(bloqueos, reloj),
      inject: [BLOQUEO_REPOSITORY, RELOJ],
    })),
    {
      provide: ConsultarCanchasUseCase,
      useFactory: (canchas: CanchaRepository, reservas: ReservasDeCancha) =>
        new ConsultarCanchasUseCase(canchas, reservas),
      inject: [CANCHA_REPOSITORY, RESERVAS_DE_CANCHA],
    },
    {
      provide: RegistrarCanchasUseCase,
      useFactory: (canchas: CanchaRepository, reloj: Reloj) =>
        new RegistrarCanchasUseCase(canchas, reloj),
      inject: [CANCHA_REPOSITORY, RELOJ],
    },
    {
      provide: EditarCanchaUseCase,
      useFactory: (c: CanchaRepository, r: ReservasDeCancha, reloj: Reloj) =>
        new EditarCanchaUseCase(c, r, reloj),
      inject: CON_RESERVAS,
    },
    {
      provide: DesactivarCanchaUseCase,
      useFactory: (c: CanchaRepository, r: ReservasDeCancha, reloj: Reloj) =>
        new DesactivarCanchaUseCase(c, r, reloj),
      inject: CON_RESERVAS,
    },
    {
      provide: EliminarCanchaUseCase,
      useFactory: (c: CanchaRepository, r: ReservasDeCancha, reloj: Reloj) =>
        new EliminarCanchaUseCase(c, r, reloj),
      inject: CON_RESERVAS,
    },
    {
      provide: ReactivarCanchaUseCase,
      useFactory: (canchas: CanchaRepository, reloj: Reloj) =>
        new ReactivarCanchaUseCase(canchas, reloj),
      inject: [CANCHA_REPOSITORY, RELOJ],
    },
  ],
})
export class CanchasModule {}
