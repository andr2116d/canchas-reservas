import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  CancelacionModule,
  REGLA_DE_CANCELACION_REPOSITORY,
  type ReglaDeCancelacionRepository,
} from '../cancelacion/api-cancelacion';
import { DisponibilidadModule } from '../disponibilidad/api-disponibilidad';
import {
  CATALOGO_DE_ADICIONALES,
  type CatalogoDeAdicionales,
} from './aplicacion/catalogo-de-adicionales.port';
import { ConsultarMiReservaUseCase } from './aplicacion/consultar-mi-reserva.use-case';
import {
  GENERADOR_DE_CODIGO,
  type GeneradorDeCodigo,
} from './aplicacion/generador-de-codigo.port';
import {
  type DependenciasDeLaReserva,
  ReservarTurnoUseCase,
} from './aplicacion/reservar-turno.use-case';
import { ResumirReservaUseCase } from './aplicacion/resumir-reserva.use-case';
import { TITULARES, type Titulares } from './aplicacion/titulares.port';
import {
  TURNOS_DEL_LOCAL,
  type TurnosDelLocal,
} from './aplicacion/turnos-del-local.port';
import {
  RESERVA_REPOSITORY,
  type ReservaRepository,
} from './dominio/reserva.repository';
import { ReservasController } from './infraestructura/http/reservas.controller';
import { MapaTurnosDelLocalAdapter } from './infraestructura/mapa/mapa-turnos-del-local.adapter';
import { CryptoGeneradorDeCodigoAdapter } from './infraestructura/persistencia/crypto-generador-de-codigo.adapter';
import { PrismaCatalogoDeAdicionalesAdapter } from './infraestructura/persistencia/prisma-catalogo-de-adicionales.adapter';
import { PrismaReservaRepository } from './infraestructura/persistencia/prisma-reserva.repository';
import { PrismaTitularesAdapter } from './infraestructura/persistencia/prisma-titulares.adapter';

const LO_QUE_SE_OFRECE = Symbol('LO_QUE_SE_OFRECE');
const QUIEN_Y_DONDE = Symbol('QUIEN_Y_DONDE');

/** El turno, la regla de cancelación y el material: lo que se muestra antes de separar. */
type LoQueSeOfrece = Pick<
  DependenciasDeLaReserva,
  'turnos' | 'reglas' | 'catalogo'
>;
/** Quién reserva, dónde se guarda, con qué código y a qué hora. */
type QuienYDonde = Omit<DependenciasDeLaReserva, keyof LoQueSeOfrece>;

const dependencias = (ofrece: LoQueSeOfrece, quien: QuienYDonde) => ({
  ...ofrece,
  ...quien,
});

/** Reservas del jugador: separar un turno del mapa y consultar la reserva propia. */
@Module({
  imports: [DisponibilidadModule, CancelacionModule],
  controllers: [ReservasController],
  providers: [
    { provide: TURNOS_DEL_LOCAL, useClass: MapaTurnosDelLocalAdapter },
    {
      provide: CATALOGO_DE_ADICIONALES,
      useClass: PrismaCatalogoDeAdicionalesAdapter,
    },
    { provide: TITULARES, useClass: PrismaTitularesAdapter },
    { provide: RESERVA_REPOSITORY, useClass: PrismaReservaRepository },
    { provide: GENERADOR_DE_CODIGO, useClass: CryptoGeneradorDeCodigoAdapter },
    {
      provide: LO_QUE_SE_OFRECE,
      useFactory: (
        turnos: TurnosDelLocal,
        reglas: ReglaDeCancelacionRepository,
        catalogo: CatalogoDeAdicionales,
      ): LoQueSeOfrece => ({ turnos, reglas, catalogo }),
      inject: [
        TURNOS_DEL_LOCAL,
        REGLA_DE_CANCELACION_REPOSITORY,
        CATALOGO_DE_ADICIONALES,
      ],
    },
    {
      provide: QUIEN_Y_DONDE,
      useFactory: (
        titulares: Titulares,
        reservas: ReservaRepository,
        codigos: GeneradorDeCodigo,
        reloj: Reloj,
      ): QuienYDonde => ({ titulares, reservas, codigos, reloj }),
      inject: [TITULARES, RESERVA_REPOSITORY, GENERADOR_DE_CODIGO, RELOJ],
    },
    {
      provide: ResumirReservaUseCase,
      useFactory: (ofrece: LoQueSeOfrece, quien: QuienYDonde) =>
        new ResumirReservaUseCase(dependencias(ofrece, quien)),
      inject: [LO_QUE_SE_OFRECE, QUIEN_Y_DONDE],
    },
    {
      provide: ReservarTurnoUseCase,
      useFactory: (ofrece: LoQueSeOfrece, quien: QuienYDonde) =>
        new ReservarTurnoUseCase(dependencias(ofrece, quien)),
      inject: [LO_QUE_SE_OFRECE, QUIEN_Y_DONDE],
    },
    {
      provide: ConsultarMiReservaUseCase,
      useFactory: (reservas: ReservaRepository, reloj: Reloj) =>
        new ConsultarMiReservaUseCase(reservas, reloj),
      inject: [RESERVA_REPOSITORY, RELOJ],
    },
  ],
})
export class ReservasModule {}
