import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EstadoReserva } from '../../../generated/prisma/enums';
import { FechaValida, MENSAJE_FECHA } from '../../horario/dto/vista-previa.dto';

const MENSAJE_CANCHA = 'Elige una cancha válida';
export const MENSAJE_ESTADO = 'Elige un estado de reserva válido';

export class ConsultarAgendaDto {
  @IsOptional()
  @FechaValida()
  @IsString({ message: MENSAJE_FECHA })
  fecha?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: MENSAJE_CANCHA })
  @Min(1, { message: MENSAJE_CANCHA })
  @Max(2147483647, { message: MENSAJE_CANCHA })
  canchaId?: number;

  @IsOptional()
  @IsEnum(EstadoReserva, { message: MENSAJE_ESTADO })
  estado?: EstadoReserva;
}
