import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidarSesionUseCase } from '../../aplicacion/validar-sesion.use-case';
import { leerTokenDeSesion } from './cookie-de-sesion';
import { ES_RUTA_PUBLICA } from './publico.decorator';
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
    if (esPublica) return true;

    const solicitud = contexto.switchToHttp().getRequest<SolicitudConSesion>();
    const sesion = await this.validarSesion.ejecutar(
      leerTokenDeSesion(solicitud),
    );
    if (!sesion) throw new UnauthorizedException();
    solicitud.sesion = sesion;
    return true;
  }
}
