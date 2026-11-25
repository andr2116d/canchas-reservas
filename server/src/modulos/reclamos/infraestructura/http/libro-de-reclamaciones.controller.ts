import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  Publico,
  type SesionValida,
  SesionDeLaSolicitud,
  SesionOpcional,
} from '../../../sesiones/api-sesiones';
import {
  type Constancia,
  RegistrarHojaUseCase,
} from '../../aplicacion/registrar-hoja.use-case';
import { SeguirHojaUseCase } from '../../aplicacion/seguir-hoja.use-case';
import type { VistaDeSeguimiento } from '../../aplicacion/vista-de-seguimiento';
import { HojaDto } from './hoja.dto';
import { leerLimiteDeHojas } from './limite-de-hojas';
import { SeguimientoDto } from './seguimiento.dto';

// Pocas hojas por hora desde una misma IP (10 por defecto), para frenar envíos automatizados.
const LIMITE_DE_HOJAS = {
  default: { limit: () => leerLimiteDeHojas(process.env), ttl: 60 * 60 * 1000 },
};

// Pocos intentos de seguimiento cada 15 minutos desde una IP: el código no se adivina probando.
const LIMITE_DE_SEGUIMIENTOS = {
  default: { limit: 10, ttl: 15 * 60 * 1000 },
};

/** Libro de Reclamaciones virtual: abierto a cualquiera, sin cuenta ni pago. */
@Controller('libro-de-reclamaciones')
export class LibroDeReclamacionesController {
  constructor(
    private readonly registrarHoja: RegistrarHojaUseCase,
    private readonly seguirHoja: SeguirHojaUseCase,
  ) {}

  /** Registra una hoja y devuelve su constancia. Con sesión de jugador, la hoja queda en su cuenta. */
  @Post()
  @SesionOpcional()
  @HttpCode(HttpStatus.CREATED)
  @Throttle(LIMITE_DE_HOJAS)
  registrar(
    @Body() datos: HojaDto,
    @SesionDeLaSolicitud() sesion?: SesionValida,
  ): Promise<Constancia> {
    const titularId = sesion?.rol === 'JUGADOR' ? sesion.usuarioId : null;
    return this.registrarHoja.ejecutar(datos, titularId);
  }

  /** Estado y plazo de una hoja con su número y su código, sin cuenta. */
  @Post('seguimiento')
  @Publico()
  @HttpCode(HttpStatus.OK)
  @Throttle(LIMITE_DE_SEGUIMIENTOS)
  seguir(
    @Body() { numero, codigo }: SeguimientoDto,
  ): Promise<VistaDeSeguimiento> {
    return this.seguirHoja.ejecutar(numero, codigo);
  }
}
