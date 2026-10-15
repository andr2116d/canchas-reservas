import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Publico } from '../../common/decorators/publico.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import {
  COOKIE_SESION,
  opcionesCookieSesion,
  opcionesRenovarCookie,
} from '../../common/sesion/cookie-sesion';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { AuthService } from './auth.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: IniciarSesionDto,
    @Req() peticion: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ) {
    const { token, usuario } = await this.auth.iniciarSesion(
      dto.correo,
      dto.contrasena,
      peticion.ip,
    );
    respuesta.cookie(COOKIE_SESION, token, opcionesRenovarCookie());
    return usuario;
  }

  @Publico()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) respuesta: Response) {
    respuesta.clearCookie(COOKIE_SESION, opcionesCookieSesion());
  }

  @Get('me')
  me(@UsuarioActual() usuario: UsuarioSesion) {
    return usuario;
  }
}
