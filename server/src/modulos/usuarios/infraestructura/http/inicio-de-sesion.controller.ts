import {
  Body,
  Controller,
  ForbiddenException,
  Header,
  Headers,
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
  resumirDispositivo,
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { CambiarContrasenaTemporalUseCase } from '../../aplicacion/cambiar-contrasena-temporal.use-case';
import {
  IniciarSesionUseCase,
  type ResultadoInicioSesion,
} from '../../aplicacion/iniciar-sesion.use-case';
import {
  CambiarContrasenaTemporalDto,
  IniciarSesionDto,
} from './iniciar-sesion.dto';
import { LIMITE_DE_INICIOS_POR_IP, LimiteDeInicios } from './limite-de-inicios';

interface DestinoDeSesion {
  rol: RolUsuario;
  requiereCompletarDatos: boolean;
  requiereCambiarContrasena: boolean;
  contrasenaTemporalVenceEn?: Date;
}

/** El motivo por el que no se abrió la sesión, sin decir si el correo existe. */
function rechazoDelInicio(
  resultado: Exclude<ResultadoInicioSesion, { tipo: 'sesion-abierta' }>,
): ForbiddenException | UnauthorizedException {
  const cuerpo = (mensaje: string) => ({ mensaje, errores: {} });
  if (resultado.tipo === 'contrasena-temporal-vencida')
    return new ForbiddenException(
      cuerpo('La contraseña temporal venció. Pide una nueva a administración.'),
    );
  if (resultado.tipo === 'cuenta-inactiva')
    return new ForbiddenException(
      cuerpo('La cuenta está inactiva. Contacta a La Previa.'),
    );
  return new UnauthorizedException(cuerpo('Correo o contraseña incorrectos.'));
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
    @Headers('user-agent') agente: string | undefined,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<DestinoDeSesion> {
    respuesta.set('Cache-Control', 'no-store');
    const espera = this.limite.segundosDeEspera(datos.correo);
    if (espera) {
      respuesta.set('Retry-After', String(espera));
      throw new ThrottlerException();
    }

    const resultado = await this.iniciarSesion.ejecutar({
      correo: datos.correo,
      contrasena: datos.contrasena,
      dispositivo: resumirDispositivo(agente),
    });
    // La contraseña fue correcta: los fallos anteriores de este correo ya no cuentan.
    if (resultado.tipo !== 'credenciales-invalidas') {
      this.limite.reiniciar(datos.correo);
    }
    if (resultado.tipo === 'credenciales-invalidas')
      this.limite.registrarFallo(datos.correo);
    if (resultado.tipo !== 'sesion-abierta') throw rechazoDelInicio(resultado);
    escribirCookieDeSesion(
      respuesta,
      resultado.sesion,
      this.configuracion.cookieSegura,
    );
    return {
      rol: resultado.rol,
      requiereCompletarDatos: resultado.requiereCompletarDatos,
      requiereCambiarContrasena: resultado.requiereCambiarContrasena,
      contrasenaTemporalVenceEn: resultado.contrasenaTemporalVenceEn,
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
    return {
      rol: sesion.rol,
      requiereCompletarDatos: false,
      requiereCambiarContrasena: false,
    };
  }
}
