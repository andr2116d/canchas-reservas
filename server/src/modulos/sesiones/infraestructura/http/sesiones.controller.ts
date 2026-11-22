import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../../../compartido/infraestructura/configuracion/configuracion';
import { CerrarSesionUseCase } from '../../aplicacion/cerrar-sesion.use-case';
import type { SesionValida } from '../../aplicacion/validar-sesion.use-case';
import { borrarCookieDeSesion, leerTokenDeSesion } from './cookie-de-sesion';
import { Publico } from './publico.decorator';
import { RequerirPermiso } from './requerir-permiso.decorator';
import { SesionDeLaSolicitud } from './sesion-de-la-solicitud.decorator';

@Controller('sesiones')
export class SesionesController {
  constructor(
    private readonly cerrarSesion: CerrarSesionUseCase,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  @Get('actual')
  @RequerirPermiso('sesion:consultar')
  consultar(@SesionDeLaSolicitud() sesion: SesionValida) {
    const { rol, requiereCambiarContrasena, venceEn } = sesion;
    return { rol, requiereCambiarContrasena, venceEn };
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
