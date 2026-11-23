import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { DatosDeLaRegla } from '../../aplicacion/definir-regla-de-cancelacion.use-case';
import type { DatosDeLaSimulacion } from '../../aplicacion/simular-cancelacion.use-case';
import type { DatosDelRango } from '../../dominio/regla-de-cancelacion';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Un rango; las reglas de horas y porcentaje las valida el dominio. */
class RangoDto implements DatosDelRango {
  @IsString(COMO_TEXTO)
  desdeHoras: string;

  @IsString(COMO_TEXTO)
  porcentaje: string;

  @IsBoolean({ message: 'Indica si se ofrece crédito.' })
  ofreceCredito: boolean;
}

/** Cuerpo de `PUT /api/cancelacion/regla`. */
export class DefinirReglaDeCancelacionDto implements DatosDeLaRegla {
  @IsArray({ message: 'Indica los rangos de la regla.' })
  @ArrayMaxSize(20, { message: 'Usa como máximo 10 rangos.' })
  @ValidateNested({ each: true })
  @Type(() => RangoDto)
  rangos: RangoDto[];
}

/** Cuerpo de `POST /api/cancelacion/simulacion`: la regla en edición y un caso de ejemplo. */
export class SimularCancelacionDto
  extends DefinirReglaDeCancelacionDto
  implements DatosDeLaSimulacion
{
  @IsString(COMO_TEXTO)
  anticipo: string;

  @IsString(COMO_TEXTO)
  pagado: string;

  @IsInt({
    message: 'Indica los minutos de anticipación como un número entero.',
  })
  minutosDeAnticipacion: number;
}
