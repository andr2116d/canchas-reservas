import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type {
  DatosDelHorario,
  DatosDeUnDia,
} from '../../aplicacion/construir-horario';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Un día del horario; las reglas de cada hora las valida el dominio. */
class DiaDelHorarioDto implements DatosDeUnDia {
  @IsString(COMO_TEXTO)
  dia: string;

  @IsBoolean({ message: 'Indica si el día abre o no.' })
  abierto: boolean;

  @IsOptional()
  @IsString(COMO_TEXTO)
  abre?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  cierra?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  inicioDeLaNoche?: string;
}

/** Cuerpo de `PUT /api/horario`: la hora general de la noche y los siete días. */
export class DefinirHorarioDto implements DatosDelHorario {
  @IsString(COMO_TEXTO)
  inicioDeLaNoche: string;

  @IsArray({ message: 'Indica el horario de los siete días.' })
  @ArrayMaxSize(7, { message: 'Indica el horario de los siete días.' })
  @ValidateNested({ each: true })
  @Type(() => DiaDelHorarioDto)
  dias: DiaDelHorarioDto[];

  /** Guardar aunque queden reservas fuera del horario nuevo: se respetan. */
  @IsOptional()
  @IsBoolean({ message: 'Indica si se confirma el cambio.' })
  confirmar?: boolean;
}
