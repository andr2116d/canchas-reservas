import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { FechaValida, MENSAJE_FECHA } from '../../horario/dto/vista-previa.dto';

const MENSAJE_CANCHA = 'Elige una cancha válida';

export class ConsultarDisponibilidadDto {
  @FechaValida()
  @IsString({ message: MENSAJE_FECHA })
  fecha!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: MENSAJE_CANCHA })
  @Min(1, { message: MENSAJE_CANCHA })
  @Max(2147483647, { message: MENSAJE_CANCHA })
  canchaId?: number;
}
