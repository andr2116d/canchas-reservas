import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  ADELANTO_REPOSITORY,
  type AdelantoRepository,
  AdelantoModule,
} from '../adelanto/api-adelanto';
import {
  HORARIO_REPOSITORY,
  type HorarioRepository,
  HorarioModule,
} from '../horario/api-horario';
import {
  TARIFA_REPOSITORY,
  type TarifaRepository,
  TarifasModule,
} from '../tarifas/api-tarifas';
import {
  ConsultarDisponibilidadUseCase,
  type DependenciasDeLaConsulta,
} from './aplicacion/consultar-disponibilidad.use-case';
import {
  OCUPACION_DEL_DIA,
  type OcupacionDelDia,
} from './aplicacion/ocupacion-del-dia.port';
import { ESCUCHA_DE_CAMBIOS } from './aplicacion/escucha-de-cambios.port';
import { DisponibilidadGateway } from './infraestructura/tiempo-real/disponibilidad.gateway';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../compartido/infraestructura/configuracion/configuracion';
import { PostgresEscucha } from '../../compartido/infraestructura/tiempo-real/postgres-escucha';
import { RetransmisionDeCambios } from './infraestructura/tiempo-real/retransmision-de-cambios';
import { DisponibilidadController } from './infraestructura/http/disponibilidad.controller';
import { PrismaOcupacionDelDiaAdapter } from './infraestructura/persistencia/prisma-ocupacion-del-dia.adapter';

/** Horario, tarifas y adelanto: lo que define los turnos y su precio. */
type ReglasDelTurno = Pick<
  DependenciasDeLaConsulta,
  'tarifas' | 'horarios' | 'adelantos'
>;
const REGLAS_DEL_TURNO = Symbol('REGLAS_DEL_TURNO');

/** Mapa público de turnos de cada día, con su precio, adelanto y estado, y el aviso de sus cambios. */
@Module({
  imports: [TarifasModule, HorarioModule, AdelantoModule],
  controllers: [DisponibilidadController],
  providers: [
    { provide: OCUPACION_DEL_DIA, useClass: PrismaOcupacionDelDiaAdapter },
    {
      provide: ESCUCHA_DE_CAMBIOS,
      useFactory: (c: Configuracion) =>
        new PostgresEscucha(c.urlBaseDeDatos, 'disponibilidad'),
      inject: [CONFIGURACION],
    },
    DisponibilidadGateway,
    RetransmisionDeCambios,
    {
      provide: REGLAS_DEL_TURNO,
      useFactory: (
        tarifas: TarifaRepository,
        horarios: HorarioRepository,
        adelantos: AdelantoRepository,
      ): ReglasDelTurno => ({ tarifas, horarios, adelantos }),
      inject: [TARIFA_REPOSITORY, HORARIO_REPOSITORY, ADELANTO_REPOSITORY],
    },
    {
      provide: ConsultarDisponibilidadUseCase,
      useFactory: (
        reglas: ReglasDelTurno,
        ocupacion: OcupacionDelDia,
        reloj: Reloj,
      ) => new ConsultarDisponibilidadUseCase({ ...reglas, ocupacion, reloj }),
      inject: [REGLAS_DEL_TURNO, OCUPACION_DEL_DIA, RELOJ],
    },
  ],
  exports: [ConsultarDisponibilidadUseCase],
})
export class DisponibilidadModule {}
