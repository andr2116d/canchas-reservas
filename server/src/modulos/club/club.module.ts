import { Module } from '@nestjs/common';
import {
  ADELANTO_REPOSITORY,
  type AdelantoRepository,
  AdelantoModule,
} from '../adelanto/api-adelanto';
import {
  CancelacionModule,
  REGLA_DE_CANCELACION_REPOSITORY,
  type ReglaDeCancelacionRepository,
} from '../cancelacion/api-cancelacion';
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
  CATALOGO_DEL_CLUB,
  type CatalogoDelClub,
} from './aplicacion/catalogo-del-club.port';
import {
  ConsultarElClubUseCase,
  type DependenciasDelClub,
} from './aplicacion/consultar-el-club.use-case';
import { ClubController } from './infraestructura/http/club.controller';
import { PrismaCatalogoDelClubAdapter } from './infraestructura/persistencia/prisma-catalogo-del-club.adapter';

/** Reglas guardadas que definen precios y condiciones: tarifas, horario, adelanto y cancelación. */
type ReglasDelClub = Omit<DependenciasDelClub, 'catalogo'>;
const REGLAS_DEL_CLUB = Symbol('REGLAS_DEL_CLUB');

/** Información pública del club para la portada y las páginas legales. */
@Module({
  imports: [TarifasModule, HorarioModule, AdelantoModule, CancelacionModule],
  controllers: [ClubController],
  providers: [
    { provide: CATALOGO_DEL_CLUB, useClass: PrismaCatalogoDelClubAdapter },
    {
      provide: REGLAS_DEL_CLUB,
      useFactory: (
        tarifas: TarifaRepository,
        horarios: HorarioRepository,
        adelantos: AdelantoRepository,
        reglas: ReglaDeCancelacionRepository,
      ): ReglasDelClub => ({ tarifas, horarios, adelantos, reglas }),
      inject: [
        TARIFA_REPOSITORY,
        HORARIO_REPOSITORY,
        ADELANTO_REPOSITORY,
        REGLA_DE_CANCELACION_REPOSITORY,
      ],
    },
    {
      provide: ConsultarElClubUseCase,
      useFactory: (reglas: ReglasDelClub, catalogo: CatalogoDelClub) =>
        new ConsultarElClubUseCase({ ...reglas, catalogo }),
      inject: [REGLAS_DEL_CLUB, CATALOGO_DEL_CLUB],
    },
  ],
})
export class ClubModule {}
