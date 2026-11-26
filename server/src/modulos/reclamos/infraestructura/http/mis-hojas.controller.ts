import { Controller, Get, Param } from '@nestjs/common';
import {
  RequerirPermiso,
  type SesionValida,
  SesionDeLaSolicitud,
} from '../../../sesiones/api-sesiones';
import { MisHojasUseCase } from '../../aplicacion/mis-hojas.use-case';
import type {
  ResumenDeHoja,
  VistaDeSeguimiento,
} from '../../aplicacion/vista-de-seguimiento';

/** «Mis reclamos»: las hojas que el jugador registró con su cuenta. */
@Controller('libro-de-reclamaciones/mis-hojas')
@RequerirPermiso('panel:jugador')
export class MisHojasController {
  constructor(private readonly misHojas: MisHojasUseCase) {}

  @Get()
  listar(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<ResumenDeHoja[]> {
    return this.misHojas.listar(sesion.usuarioId);
  }

  @Get(':numero')
  ver(
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Param('numero') numero: string,
  ): Promise<VistaDeSeguimiento> {
    return this.misHojas.ver(sesion.usuarioId, numero);
  }
}
