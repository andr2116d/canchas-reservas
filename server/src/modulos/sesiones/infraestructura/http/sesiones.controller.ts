import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../../../compartido/infraestructura/configuracion/configuracion';
import { CerrarSesionUseCase } from '../../aplicacion/cerrar-sesion.use-case';
import { OmitirCambioDeContrasenaUseCase } from '../../aplicacion/omitir-cambio-de-contrasena.use-case';
import type { SesionValida } from '../../aplicacion/validar-sesion.use-case';
import { borrarCookieDeSesion, leerTokenDeSesion } from './cookie-de-sesion';
import { Publico } from './publico.decorator';
import { RequerirPermiso } from './requerir-permiso.decorator';
import { SesionDeLaSolicitud } from './sesion-de-la-solicitud.decorator';

@Controller('sesiones')
export class SesionesController {
  constructor(
    private readonly cerrarSesion: CerrarSesionUseCase,
    private readonly omitirCambioDeContrasena: OmitirCambioDeContrasenaUseCase,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  @Get('actual')
  @RequerirPermiso('sesion:consultar')
  consultar(@SesionDeLaSolicitud() sesion: SesionValida) {
    const { rol, requiereCambiarContrasena, cambioOmitido, venceEn } = sesion;
    const { contrasenaTemporalVenceEn, requiereCompletarDatos } = sesion;
    return {
      rol,
      requiereCompletarDatos,
      requiereCambiarContrasena,
      cambioOmitido,
      contrasenaTemporalVenceEn,
      venceEn,
    };
  }

  @Post('actual/cambio-omitido')
  @RequerirPermiso('sesion:cambiar-contrasena-temporal')
  @HttpCode(HttpStatus.NO_CONTENT)
  omitirCambio(@SesionDeLaSolicitud() sesion: SesionValida): Promise<void> {
    return this.omitirCambioDeContrasena.ejecutar(sesion);
  }

  @Delete('actual')
  @Publico()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  async cerrar(
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    await this.cerrarSesion.ejecutar(leerTokenDeSesion(solicitud));
    borrarCookieDeSesion(respuesta, this.configuracion.cookieSegura);
  }
}
