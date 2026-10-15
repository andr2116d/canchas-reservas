import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { EstadoCancha, TamanoCancha } from '../../../generated/prisma/enums';

export class CrearCanchaDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 40)
  nombre!: string;

  @IsEnum(TamanoCancha)
  tamano!: TamanoCancha;

  @IsBoolean()
  iluminacion!: boolean;

  @IsOptional()
  @IsEnum(EstadoCancha)
  estado?: EstadoCancha;
}
