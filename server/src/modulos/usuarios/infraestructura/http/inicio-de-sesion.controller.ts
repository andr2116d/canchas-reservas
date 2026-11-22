import {
  Body,
  Controller,
  ForbiddenException,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle, ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../../../compartido/infraestructura/configuracion/configuracion';
import type { RolUsuario } from '../../../../compartido/dominio/rol-usuario';
import {
  escribirCookieDeSesion,
  Publico,
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { CambiarContrasenaTemporalUseCase } from '../../aplicacion/cambiar-contrasena-temporal.use-case';
import { IniciarSesionUseCase } from '../../aplicacion/iniciar-sesion.use-case';
import {
  CambiarContrasenaTemporalDto,
  IniciarSesionDto,
} from './iniciar-sesion.dto';
import { LIMITE_DE_INICIOS_POR_IP, LimiteDeInicios } from './limite-de-inicios';

interface DestinoDeSesion {
  rol: RolUsuario;
  requiereCambiarContrasena: boolean;
}

@Controller('sesiones')
export class InicioDeSesionController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly cambiarContrasena: CambiarContrasenaTemporalUseCase,
    private readonly limite: LimiteDeInicios,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  @Post()
  @Publico()
  @HttpCode(HttpStatus.OK)
  @Throttle(LIMITE_DE_INICIOS_POR_IP)
  async iniciar(
    @Body() datos: IniciarSesionDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<DestinoDeSesion> {
    respuesta.set('Cache-Control', 'no-store');
    const espera = await this.limite.segundosDeEspera(datos.correo);
    if (espera) {
      respuesta.set('Retry-After', String(espera));
      throw new ThrottlerException();
    }

    const resultado = await this.iniciarSesion.ejecutar(datos);
    if (resultado.tipo === 'cuenta-inactiva') {
      throw new ForbiddenException({
        mensaje: 'Tu cuenta está inactiva. Contacta a La Previa.',
        errores: {},
      });
    }
    if (resultado.tipo === 'credenciales-invalidas') {
      throw new UnauthorizedException({
        mensaje: 'Correo o contraseña incorrectos.',
        errores: {},
      });
    }
    escribirCookieDeSesion(
      respuesta,
      resultado.sesion,
      this.configuracion.cookieSegura,
    );
    return {
      rol: resultado.rol,
      requiereCambiarContrasena: resultado.requiereCambiarContrasena,
    };
  }

  @Patch('contrasena-temporal')
  @RequerirPermiso('sesion:cambiar-contrasena-temporal')
  @Throttle(LIMITE_DE_INICIOS_POR_IP)
  @Header('Cache-Control', 'no-store')
  async renovarContrasena(
    @Body() datos: CambiarContrasenaTemporalDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<DestinoDeSesion> {
    const renovada = await this.cambiarContrasena.ejecutar(
      sesion,
      datos.contrasena,
    );
    if (!renovada) throw new UnauthorizedException();
    escribirCookieDeSesion(
      respuesta,
      renovada,
      this.configuracion.cookieSegura,
    );
    return { rol: sesion.rol, requiereCambiarContrasena: false };
  }
}
