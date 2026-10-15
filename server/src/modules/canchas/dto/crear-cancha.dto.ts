import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsString, Length } from 'class-validator';
import { TamanoCancha } from '../../../generated/prisma/enums';

export class CrearCanchaDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre es obligatorio' })
  @Length(3, 40, { message: 'El nombre debe tener entre 3 y 40 caracteres' })
  nombre!: string;

  @IsEnum(TamanoCancha, { message: 'Elige Fútbol 5 o Fútbol 7' })
  tamano!: TamanoCancha;

  @IsBoolean({ message: 'Indica si la cancha tiene iluminación' })
  iluminacion!: boolean;
}
