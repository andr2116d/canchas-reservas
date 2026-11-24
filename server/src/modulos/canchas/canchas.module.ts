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
import { CanchasController } from './infraestructura/http/canchas.controller';
import { EstadoDeCanchaController } from './infraestructura/http/estado-de-cancha.controller';
import { PrismaCanchaRepository } from './infraestructura/persistencia/prisma-cancha.repository';
import { SinReservasAdapter } from './infraestructura/reservas/sin-reservas.adapter';

const CON_RESERVAS = [CANCHA_REPOSITORY, RESERVAS_DE_CANCHA, RELOJ];

/** Canchas del local, sus características, su estado y la auditoría de sus cambios. */
@Module({
  controllers: [CanchasController, EstadoDeCanchaController],
  providers: [
    { provide: CANCHA_REPOSITORY, useClass: PrismaCanchaRepository },
    { provide: RESERVAS_DE_CANCHA, useClass: SinReservasAdapter },
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
