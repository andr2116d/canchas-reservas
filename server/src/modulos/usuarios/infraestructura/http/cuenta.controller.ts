import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../../../compartido/infraestructura/configuracion/configuracion';
import {
  escribirCookieDeSesion,
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ActualizarMiCuentaUseCase } from '../../aplicacion/actualizar-mi-cuenta.use-case';
import { CambiarMiContrasenaUseCase } from '../../aplicacion/cambiar-mi-contrasena.use-case';
import {
  type Cuenta,
  ConsultarCuentaUseCase,
} from '../../aplicacion/consultar-cuenta.use-case';
import { LIMITE_DE_INICIOS_POR_IP } from './limite-de-inicios';
import { ActualizarMiCuentaDto, CambiarMiContrasenaDto } from './mi-cuenta.dto';

/** Cuenta propia de quien tiene la sesión iniciada, para los tres roles. */
@Controller('cuenta')
@RequerirPermiso('cuenta:propia')
export class CuentaController {
  constructor(
    private readonly consultarCuenta: ConsultarCuentaUseCase,
    private readonly actualizarCuenta: ActualizarMiCuentaUseCase,
    private readonly cambiarContrasena: CambiarMiContrasenaUseCase,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  @Get()
  async consultar(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<Cuenta> {
    const cuenta = await this.consultarCuenta.ejecutar(sesion.usuarioId);
    if (!cuenta) throw new UnauthorizedException();
    return cuenta;
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  actualizar(
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Body() cambios: ActualizarMiCuentaDto,
  ): Promise<void> {
    return this.actualizarCuenta.ejecutar(sesion.usuarioId, cambios);
  }

  @Patch('contrasena')
  @Throttle(LIMITE_DE_INICIOS_POR_IP)
  async renovarContrasena(
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Body() { actual, contrasena }: CambiarMiContrasenaDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<{ rol: SesionValida['rol']; requiereCambiarContrasena: false }> {
    const renovada = await this.cambiarContrasena.ejecutar(
      sesion,
      actual,
      contrasena,
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
