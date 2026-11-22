import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  CONFIGURACION,
  type Configuracion,
  leerLimiteDeRegistros,
} from '../../../../compartido/infraestructura/configuracion/configuracion';
import { AbrirSesionUseCase } from '../../../sesiones/aplicacion/abrir-sesion.use-case';
import { escribirCookieDeSesion } from '../../../sesiones/infraestructura/http/cookie-de-sesion';
import { Publico } from '../../../sesiones/infraestructura/http/publico.decorator';
import { RegistrarJugadorUseCase } from '../../aplicacion/registrar-jugador.use-case';
import { RegistrarJugadorDto } from './registrar-jugador.dto';

// Pocos registros por hora desde una misma IP (10 por defecto), para frenar altas automatizadas.
const LIMITE_DE_REGISTROS = {
  default: {
    limit: () => leerLimiteDeRegistros(process.env),
    ttl: 60 * 60 * 1000,
  },
};

/** Cuentas de jugadores. */
@Controller('jugadores')
export class JugadoresController {
  constructor(
    private readonly registrarJugador: RegistrarJugadorUseCase,
    private readonly abrirSesion: AbrirSesionUseCase,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  /** Crea la cuenta de un jugador activo y deja su sesión iniciada. */
  @Post()
  @Publico()
  @HttpCode(HttpStatus.CREATED)
  @Throttle(LIMITE_DE_REGISTROS)
  async registrar(
    @Body() datos: RegistrarJugadorDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<{ nombres: string }> {
    const jugador = await this.registrarJugador.ejecutar(datos);
    const sesion = await this.abrirSesion.ejecutar(jugador.id);
    escribirCookieDeSesion(respuesta, sesion, this.configuracion.cookieSegura);
    return { nombres: jugador.nombres };
  }
}
