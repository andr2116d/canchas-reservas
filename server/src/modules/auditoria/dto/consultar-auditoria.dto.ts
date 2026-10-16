import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { ConsultaPaginadaDto } from './consulta-paginada.dto';

const CODIGO = /^[A-Z_]{1,40}$/;
export const MENSAJE_ENTIDAD = 'Elige una entidad válida';
export const MENSAJE_ACCION = 'Elige una acción válida';
export const MENSAJE_USUARIO = 'Elige un usuario válido';

export class ConsultarAuditoriaDto extends ConsultaPaginadaDto {
  @IsOptional()
  @Matches(CODIGO, { message: MENSAJE_ENTIDAD })
  entidad?: string;

  @IsOptional()
  @Matches(CODIGO, { message: MENSAJE_ACCION })
  accion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: MENSAJE_USUARIO })
  @Min(1, { message: MENSAJE_USUARIO })
  @Max(2147483647, { message: MENSAJE_USUARIO })
  usuarioId?: number;
}
