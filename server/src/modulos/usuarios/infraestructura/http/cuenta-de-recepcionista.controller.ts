import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { DesactivarRecepcionistaUseCase } from '../../aplicacion/desactivar-recepcionista.use-case';
import { ReactivarRecepcionistaUseCase } from '../../aplicacion/reactivar-recepcionista.use-case';
import { RestablecerContrasenaUseCase } from '../../aplicacion/restablecer-contrasena.use-case';
import { ContrasenaTemporalDto } from './contrasena-temporal.dto';
import { ID_DE_RECEPCIONISTA } from './id-de-recepcionista.pipe';

/** Acciones del administrador sobre el acceso de una recepcionista. */
@Controller('recepcionistas/:id')
@RequerirPermiso('personal:gestionar-recepcionistas')
export class CuentaDeRecepcionistaController {
  constructor(
    private readonly desactivar: DesactivarRecepcionistaUseCase,
    private readonly reactivar: ReactivarRecepcionistaUseCase,
    private readonly restablecer: RestablecerContrasenaUseCase,
  ) {}

  @Post('desactivacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  desactivarCuenta(
    @Param('id', ID_DE_RECEPCIONISTA) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.desactivar.ejecutar(id, sesion.usuarioId);
  }

  @Post('reactivacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  reactivarCuenta(
    @Param('id', ID_DE_RECEPCIONISTA) id: number,
    @Body() { contrasena }: ContrasenaTemporalDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.reactivar.ejecutar(id, contrasena, sesion.usuarioId);
  }

  @Post('restablecimiento-de-contrasena')
  @HttpCode(HttpStatus.NO_CONTENT)
  restablecerContrasena(
    @Param('id', ID_DE_RECEPCIONISTA) id: number,
    @Body() { contrasena }: ContrasenaTemporalDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.restablecer.ejecutar(id, contrasena, sesion.usuarioId);
  }
}
