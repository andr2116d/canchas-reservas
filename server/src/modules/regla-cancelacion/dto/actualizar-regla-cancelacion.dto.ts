import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { TipoCompensacion } from '../../../generated/prisma/enums';

export class ActualizarReglaCancelacionDto {
  @IsInt({ message: 'Las horas de anticipación deben ser un número entero' })
  @Min(0, {
    message: 'Las horas de anticipación deben ser mayores o iguales a 0',
  })
  @Max(2147483647, {
    message: 'Las horas de anticipación no pueden superar 2147483647',
  })
  horasAnticipacion!: number;

  @IsEnum(TipoCompensacion, { message: 'Elige Devolución o Crédito' })
  tipoCompensacion!: TipoCompensacion;
}
