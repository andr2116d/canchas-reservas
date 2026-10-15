import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ES_PUBLICO } from '../decorators/publico.decorator';
import { cuerpoError } from '../errores';
import {
  COOKIE_SESION,
  crearPayloadSesion,
  opcionesCookieSesion,
  opcionesRenovarCookie,
} from '../sesion/cookie-sesion';
import type { PeticionConUsuario } from '../sesion/usuario-sesion';

const MENSAJE_SIN_SESION = 'Tu sesión no es válida. Inicia sesión de nuevo.';

@Injectable()
export class SesionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexto: ExecutionContext) {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) return true;

    const peticion = contexto.switchToHttp().getRequest<PeticionConUsuario>();
    const respuesta = contexto.switchToHttp().getResponse<Response>();
    const token = (peticion.cookies as Record<string, string> | undefined)?.[
      COOKIE_SESION
    ];
    if (!token) throw this.rechazar(respuesta, false);

    let id: number;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      id = Number(payload.sub);
    } catch {
      throw this.rechazar(respuesta, true);
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        rol: true,
        estado: true,
      },
    });
    if (!usuario || usuario.estado !== 'ACTIVO') {
      throw this.rechazar(respuesta, true);
    }

    const { estado: _estado, ...datos } = usuario;
    peticion.usuario = datos;
    respuesta.cookie(
      COOKIE_SESION,
      await this.jwt.signAsync(crearPayloadSesion(usuario.id, usuario.rol)),
      opcionesRenovarCookie(),
    );
    return true;
  }

  private rechazar(respuesta: Response, borrarCookie: boolean) {
    if (borrarCookie) respuesta.clearCookie(COOKIE_SESION, opcionesCookieSesion());
    return new UnauthorizedException(cuerpoError(401, MENSAJE_SIN_SESION));
  }
}
