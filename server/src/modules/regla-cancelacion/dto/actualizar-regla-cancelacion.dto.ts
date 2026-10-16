import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { TipoCompensacion } from '../../../generated/prisma/enums';

export const HORAS_MAXIMAS = 2147483647;
export const MENSAJE_HORAS_ENTERO =
  'Las horas de anticipación deben ser un número entero';
export const MENSAJE_HORAS_MINIMO =
  'Las horas de anticipación deben ser mayores o iguales a 0';
export const MENSAJE_HORAS_MAXIMO =
  'Las horas de anticipación son demasiado altas';
export const MENSAJE_TIPO_COMPENSACION = 'Elige Devolución o Crédito';

export class ActualizarReglaCancelacionDto {
  @Max(HORAS_MAXIMAS, { message: MENSAJE_HORAS_MAXIMO })
  @Min(0, { message: MENSAJE_HORAS_MINIMO })
  @IsInt({ message: MENSAJE_HORAS_ENTERO })
  horasAnticipacion!: number;

  @IsEnum(TipoCompensacion, { message: MENSAJE_TIPO_COMPENSACION })
  tipoCompensacion!: TipoCompensacion;
}
