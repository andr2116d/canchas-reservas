import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  MisSesionesUseCase,
  type VistaDeSesion,
} from '../../aplicacion/mis-sesiones.use-case';
import type { SesionValida } from '../../aplicacion/validar-sesion.use-case';
import { RequerirPermiso } from './requerir-permiso.decorator';
import { SesionDeLaSolicitud } from './sesion-de-la-solicitud.decorator';

/** Las sesiones abiertas de la propia cuenta, para cualquier rol. */
@Controller('cuenta/sesiones')
@RequerirPermiso('cuenta:propia')
export class MisSesionesController {
  constructor(private readonly misSesiones: MisSesionesUseCase) {}

  @Get()
  listar(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<VistaDeSesion[]> {
    return this.misSesiones.consultar(sesion);
  }

  @Delete('otras')
  @HttpCode(HttpStatus.NO_CONTENT)
  cerrarOtras(@SesionDeLaSolicitud() sesion: SesionValida): Promise<void> {
    return this.misSesiones.cerrarOtras(sesion);
  }
}
