import { IsString } from 'class-validator';
import type { DatosDelPlazo } from '../../aplicacion/definir-plazo-de-pago.use-case';

/** Cuerpo de `PUT /api/plazo-de-pago`; el rango de los minutos lo valida el dominio. */
export class DefinirPlazoDePagoDto implements DatosDelPlazo {
  @IsString({ message: 'Ingresa los minutos como texto.' })
  minutos: string;
}
