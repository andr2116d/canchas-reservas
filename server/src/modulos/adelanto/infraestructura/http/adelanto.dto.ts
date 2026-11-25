import { IsString } from 'class-validator';
import type { DatosDelAdelanto } from '../../aplicacion/definir-adelanto.use-case';

/** Cuerpo de `PUT /api/adelanto`; el rango del porcentaje lo valida el dominio. */
export class DefinirAdelantoDto implements DatosDelAdelanto {
  @IsString({ message: 'Ingresa el porcentaje como texto.' })
  porcentaje: string;
}
