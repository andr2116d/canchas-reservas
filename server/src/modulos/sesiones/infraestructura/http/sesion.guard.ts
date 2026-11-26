import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { ValidarSesionUseCase } from '../../aplicacion/validar-sesion.use-case';
import { puedeAcceder } from '../../dominio/permisos-de-sesion';
import { leerTokenDeSesion } from './cookie-de-sesion';
import { ES_RUTA_PUBLICA } from './publico.decorator';
import { ADJUNTA_SESION_OPCIONAL } from './sesion-opcional.decorator';
import { RequerirPermiso } from './requerir-permiso.decorator';
import type { SolicitudConSesion } from './sesion-de-la-solicitud.decorator';

/** Exige una sesión vigente en toda ruta que no esté marcada con @Publico(). */
@Injectable()
export class SesionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly validarSesion: ValidarSesionUseCase,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(
      ES_RUTA_PUBLICA,
      [contexto.getHandler(), contexto.getClass()],
    );
    const http = contexto.switchToHttp();
    const solicitud = http.getRequest<SolicitudConSesion>();
    if (esPublica) return this.adjuntarSesionOpcional(contexto, solicitud);

    const permiso = this.reflector.getAllAndOverride(RequerirPermiso, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    const sesion = await this.validarSesion.ejecutar(
      leerTokenDeSesion(solicitud),
      (acceso) =>
        permiso !== 'sesion:consultar' && puedeAcceder(acceso, permiso),
    );
    http.getResponse<Response>().set('Cache-Control', 'no-store');
    if (!sesion) throw new UnauthorizedException();
    if (!puedeAcceder(sesion, permiso)) throw new ForbiddenException();
    solicitud.sesion = sesion;
    return true;
  }

  private async adjuntarSesionOpcional(
    contexto: ExecutionContext,
    solicitud: SolicitudConSesion,
  ): Promise<true> {
    const adjunta = this.reflector.getAllAndOverride<boolean>(
      ADJUNTA_SESION_OPCIONAL,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (adjunta) {
      const token = leerTokenDeSesion(solicitud);
      solicitud.sesion = await this.validarSesion.ejecutar(token, () => false);
    }
    return true;
  }
}
