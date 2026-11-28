import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  CancelacionModule,
  REGLA_DE_CANCELACION_REPOSITORY,
  type ReglaDeCancelacionRepository,
} from '../cancelacion/api-cancelacion';
import { AvisosModule } from '../avisos/api-avisos';
import { DisponibilidadModule } from '../disponibilidad/api-disponibilidad';
import {
  PlazoDePagoModule,
  PlazoVigenteUseCase,
} from '../plazo-de-pago/api-plazo-de-pago';
import {
  AVISOS_DE_RESERVA,
  type AvisosDeReserva,
} from './aplicacion/avisos-de-reserva.port';
import {
  AGENDA_DEL_LOCAL,
  type AgendaDelLocal,
} from './aplicacion/agenda-del-local.port';
import {
  CATALOGO_DE_ADICIONALES,
  type CatalogoDeAdicionales,
} from './aplicacion/catalogo-de-adicionales.port';
import { ConsultarAgendaUseCase } from './aplicacion/consultar-agenda.use-case';
import { ConsultarMiReservaUseCase } from './aplicacion/consultar-mi-reserva.use-case';
import {
  GENERADOR_DE_CODIGO,
  type GeneradorDeCodigo,
} from './aplicacion/generador-de-codigo.port';
import {
  PAGOS_DE_RESERVAS,
  type PagosDeReservas,
} from './aplicacion/pagos-de-reservas.port';
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
import { CampanaAvisosDeReservaAdapter } from './infraestructura/avisos/campana-avisos-de-reserva.adapter';
import { AgendaController } from './infraestructura/http/agenda.controller';
import { ReservasController } from './infraestructura/http/reservas.controller';
import { MapaTurnosDelLocalAdapter } from './infraestructura/mapa/mapa-turnos-del-local.adapter';
import { CryptoGeneradorDeCodigoAdapter } from './infraestructura/persistencia/crypto-generador-de-codigo.adapter';
import { PrismaAgendaDelLocalAdapter } from './infraestructura/persistencia/prisma-agenda-del-local.adapter';
import { PrismaCatalogoDeAdicionalesAdapter } from './infraestructura/persistencia/prisma-catalogo-de-adicionales.adapter';
import { PrismaReservaRepository } from './infraestructura/persistencia/prisma-reserva.repository';
import { PrismaTitularesAdapter } from './infraestructura/persistencia/prisma-titulares.adapter';
import { SinPagosAdapter } from './infraestructura/persistencia/sin-pagos.adapter';

const LO_QUE_SE_OFRECE = Symbol('LO_QUE_SE_OFRECE');
const REGISTRO = Symbol('REGISTRO_DE_RESERVAS');

/** El turno, la regla de cancelación, el plazo para pagar y el material: lo que se muestra antes de separar. */
type LoQueSeOfrece = Pick<
  DependenciasDeLaReserva,
  'turnos' | 'reglas' | 'plazos' | 'catalogo'
>;
/** Dónde se guarda, con qué código y a quién se avisa. */
type Registro = Pick<
  DependenciasDeLaReserva,
  'reservas' | 'codigos' | 'avisos'
>;

const dependencias = (
  ofrece: LoQueSeOfrece,
  registro: Registro,
  titulares: Titulares,
  reloj: Reloj,
): DependenciasDeLaReserva => ({ ...ofrece, ...registro, titulares, reloj });
const INYECTADAS = [LO_QUE_SE_OFRECE, REGISTRO, TITULARES, RELOJ];

/** Reservas: el jugador separa un turno y ve la suya; el personal consulta la agenda del día. */
@Module({
  imports: [
    DisponibilidadModule,
    CancelacionModule,
    PlazoDePagoModule,
    AvisosModule,
  ],
  controllers: [ReservasController, AgendaController],
  providers: [
    { provide: TURNOS_DEL_LOCAL, useClass: MapaTurnosDelLocalAdapter },
    {
      provide: CATALOGO_DE_ADICIONALES,
      useClass: PrismaCatalogoDeAdicionalesAdapter,
    },
    { provide: TITULARES, useClass: PrismaTitularesAdapter },
    { provide: RESERVA_REPOSITORY, useClass: PrismaReservaRepository },
    { provide: GENERADOR_DE_CODIGO, useClass: CryptoGeneradorDeCodigoAdapter },
    { provide: AVISOS_DE_RESERVA, useClass: CampanaAvisosDeReservaAdapter },
    { provide: AGENDA_DEL_LOCAL, useClass: PrismaAgendaDelLocalAdapter },
    { provide: PAGOS_DE_RESERVAS, useClass: SinPagosAdapter },
    {
      provide: LO_QUE_SE_OFRECE,
      useFactory: (
        turnos: TurnosDelLocal,
        reglas: ReglaDeCancelacionRepository,
        plazos: PlazoVigenteUseCase,
        catalogo: CatalogoDeAdicionales,
      ): LoQueSeOfrece => ({ turnos, reglas, plazos, catalogo }),
      inject: [
        TURNOS_DEL_LOCAL,
        REGLA_DE_CANCELACION_REPOSITORY,
        PlazoVigenteUseCase,
        CATALOGO_DE_ADICIONALES,
      ],
    },
    {
      provide: REGISTRO,
      useFactory: (
        reservas: ReservaRepository,
        codigos: GeneradorDeCodigo,
        avisos: AvisosDeReserva,
      ): Registro => ({ reservas, codigos, avisos }),
      inject: [RESERVA_REPOSITORY, GENERADOR_DE_CODIGO, AVISOS_DE_RESERVA],
    },
    {
      provide: ResumirReservaUseCase,
      useFactory: (...deps: Parameters<typeof dependencias>) =>
        new ResumirReservaUseCase(dependencias(...deps)),
      inject: INYECTADAS,
    },
    {
      provide: ReservarTurnoUseCase,
      useFactory: (...deps: Parameters<typeof dependencias>) =>
        new ReservarTurnoUseCase(dependencias(...deps)),
      inject: INYECTADAS,
    },
    {
      provide: ConsultarMiReservaUseCase,
      useFactory: (reservas: ReservaRepository, reloj: Reloj) =>
        new ConsultarMiReservaUseCase(reservas, reloj),
      inject: [RESERVA_REPOSITORY, RELOJ],
    },
    {
      provide: ConsultarAgendaUseCase,
      useFactory: (
        agenda: AgendaDelLocal,
        pagos: PagosDeReservas,
        reloj: Reloj,
      ) => new ConsultarAgendaUseCase(agenda, pagos, reloj),
      inject: [AGENDA_DEL_LOCAL, PAGOS_DE_RESERVAS, RELOJ],
    },
  ],
})
export class ReservasModule {}
