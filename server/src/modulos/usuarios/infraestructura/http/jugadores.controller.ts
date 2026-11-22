import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RegistrarJugadorUseCase } from '../../aplicacion/registrar-jugador.use-case';
import { RegistrarJugadorDto } from './registrar-jugador.dto';

// Hasta 10 registros por hora desde una misma IP, para frenar altas automatizadas.
const LIMITE_DE_REGISTROS = { default: { limit: 10, ttl: 60 * 60 * 1000 } };

/** Cuentas de jugadores. */
@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly registrarJugador: RegistrarJugadorUseCase) {}

  /** Crea la cuenta de un jugador activo. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle(LIMITE_DE_REGISTROS)
  async registrar(
    @Body() datos: RegistrarJugadorDto,
  ): Promise<{ nombres: string }> {
    const jugador = await this.registrarJugador.ejecutar(datos);
    return { nombres: jugador.nombres };
  }
}
