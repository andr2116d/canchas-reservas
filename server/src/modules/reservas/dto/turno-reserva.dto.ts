import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { CampoHora } from '../../horario/dto/dia-horario.dto';
import { FechaValida, MENSAJE_FECHA } from '../../horario/dto/vista-previa.dto';

const MENSAJE_CANCHA = 'Elige una cancha válida';

export class TurnoReservaDto {
  @Type(() => Number)
  @IsInt({ message: MENSAJE_CANCHA })
  @Min(1, { message: MENSAJE_CANCHA })
  @Max(2147483647, { message: MENSAJE_CANCHA })
  canchaId!: number;

  @FechaValida()
  @IsString({ message: MENSAJE_FECHA })
  fecha!: string;

  @CampoHora('La hora de inicio es obligatoria')
  horaInicio!: string;
}
