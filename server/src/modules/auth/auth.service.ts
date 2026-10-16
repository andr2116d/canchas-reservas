import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { cuerpoError } from '../../common/errores';
import { crearPayloadSesion } from '../../common/sesion/cookie-sesion';
import { PrismaService } from '../../prisma/prisma.service';

export const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos';
export const MENSAJE_CUENTA_INACTIVA =
  'Tu cuenta está desactivada. Contacta al administrador.';

type MotivoAcceso = 'OK' | 'CREDENCIALES' | 'INACTIVO';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async iniciarSesion(correo: string, contrasena: string, ip?: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    const coincide = usuario?.passwordHash
      ? await compare(contrasena, usuario.passwordHash)
      : false;

    if (!usuario || !coincide) {
      await this.registrar(usuario?.id, correo, 'CREDENCIALES', ip);
      throw new UnauthorizedException(cuerpoError(401, MENSAJE_CREDENCIALES));
    }
    if (usuario.estado !== 'ACTIVO') {
      await this.registrar(usuario.id, correo, 'INACTIVO', ip);
      throw new ForbiddenException(cuerpoError(403, MENSAJE_CUENTA_INACTIVA));
    }

    await this.registrar(usuario.id, correo, 'OK', ip);
    const token = await this.jwt.signAsync(
      crearPayloadSesion(usuario.id, usuario.rol),
    );
    return {
      token,
      usuario: { id: usuario.id, nombres: usuario.nombres, rol: usuario.rol },
    };
  }

  private registrar(
    usuarioId: number | undefined,
    correo: string,
    motivo: MotivoAcceso,
    ip?: string,
  ) {
    return this.prisma.registroAcceso.create({
      data: { usuarioId, correo, exito: motivo === 'OK', motivo, ip },
    });
  }
}
