import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { DatosParaBloquear } from '../../aplicacion/bloquear-canchas.use-case';
import type { Repeticion } from '../../dominio/repeticion';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

class RepeticionDto implements Repeticion {
  @IsString({ message: 'Elige cada cuánto se repite.' })
  frecuencia: string;

  @IsString({ message: 'Elige hasta qué fecha se repite.' })
  hasta: string;
}

/** Cuerpo de `POST /api/bloqueos`: fechas `AAAA-MM-DD` y horas `HH:MM` de Lima; el dominio valida cada regla. */
export class BloquearCanchasDto implements DatosParaBloquear {
  @IsArray({ message: 'Elige al menos una cancha.' })
  @ArrayMaxSize(50, { message: 'Elige canchas de la lista.' })
  @IsInt({ each: true, message: 'Elige canchas de la lista.' })
  canchaIds: number[];

  @IsString({ message: 'Elige si es programado o de emergencia.' })
  tipo: string;

  @IsBoolean({ message: 'Indica si empieza ahora.' })
  desdeAhora: boolean;

  @IsOptional()
  @IsString(COMO_TEXTO)
  desdeFecha?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  desdeHora?: string;

  @IsString(COMO_TEXTO)
  hastaFecha: string;

  @IsString(COMO_TEXTO)
  hastaHora: string;

  @IsString(COMO_TEXTO)
  motivo: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RepeticionDto)
  repeticion?: RepeticionDto;
}
