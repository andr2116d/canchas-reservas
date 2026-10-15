import { IsEnum, IsOptional } from 'class-validator';
import { EstadoUsuario } from '../../../generated/prisma/enums';

export class ListarRecepcionistasDto {
  @IsOptional()
  @IsEnum(EstadoUsuario, { message: 'Elige un estado válido' })
  estado?: EstadoUsuario;
}
