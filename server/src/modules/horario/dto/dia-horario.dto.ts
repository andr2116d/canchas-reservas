import { applyDecorators } from '@nestjs/common';
import {
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MENSAJE_FORMATO_HORA =
  'La hora debe tener el formato HH:mm, de 00:00 a 23:59';
export const MENSAJE_DIA_SEMANA = 'El día de la semana debe ser del 1 al 7';

export const CampoHora = (obligatoria: string) =>
  applyDecorators(
    Matches(FORMATO_HORA, { message: MENSAJE_FORMATO_HORA }),
    IsString({ message: obligatoria }),
  );

const SoloSiAbre = () =>
  ValidateIf((dia: DiaHorarioDto) => dia.abierto === true);

export class DiaHorarioDto {
  @Max(7, { message: MENSAJE_DIA_SEMANA })
  @Min(1, { message: MENSAJE_DIA_SEMANA })
  @IsInt({ message: MENSAJE_DIA_SEMANA })
  diaSemana!: number;

  @IsBoolean({ message: 'Indica si el día abre' })
  abierto!: boolean;

  @SoloSiAbre()
  @CampoHora('Indica la hora de apertura')
  apertura?: string | null;

  @SoloSiAbre()
  @CampoHora('Indica la hora de cierre')
  cierre?: string | null;
}
