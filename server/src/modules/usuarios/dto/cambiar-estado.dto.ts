import { IsEnum } from 'class-validator';
import { EstadoUsuario } from '../../../generated/prisma/enums';

export class CambiarEstadoDto {
  @IsEnum(EstadoUsuario, { message: 'Elige un estado válido' })
  estado!: EstadoUsuario;
}
