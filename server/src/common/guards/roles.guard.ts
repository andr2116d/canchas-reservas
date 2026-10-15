import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '../../generated/prisma/enums';
import { ROLES } from '../decorators/roles.decorator';
import { cuerpoError } from '../errores';
import type { PeticionConUsuario } from '../sesion/usuario-sesion';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!roles?.length) return true;

    const usuario = contexto.switchToHttp().getRequest<PeticionConUsuario>().usuario;
    if (!usuario || !roles.includes(usuario.rol)) {
      throw new ForbiddenException(cuerpoError(403, 'Acceso no autorizado'));
    }
    return true;
  }
}
