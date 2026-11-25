import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type SesionValida,
  SesionDeLaSolicitud,
  SesionOpcional,
} from '../../../sesiones/api-sesiones';
import {
  type Constancia,
  RegistrarHojaUseCase,
} from '../../aplicacion/registrar-hoja.use-case';
import { leerLimiteDeHojas } from './limite-de-hojas';
import { HojaDto } from './hoja.dto';

// Pocas hojas por hora desde una misma IP (10 por defecto), para frenar envíos automatizados.
const LIMITE_DE_HOJAS = {
  default: { limit: () => leerLimiteDeHojas(process.env), ttl: 60 * 60 * 1000 },
};

/** Libro de Reclamaciones virtual: abierto a cualquiera, sin cuenta ni pago. */
@Controller('libro-de-reclamaciones')
export class LibroDeReclamacionesController {
  constructor(private readonly registrarHoja: RegistrarHojaUseCase) {}

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
}
