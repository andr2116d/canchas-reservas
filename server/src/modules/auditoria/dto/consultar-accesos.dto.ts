import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ConsultaPaginadaDto } from './consulta-paginada.dto';

export const MENSAJE_EXITO = 'Elige un resultado válido';
export const MENSAJE_CORREO = 'El correo debe tener como máximo 120 caracteres';

export class ConsultarAccesosDto extends ConsultaPaginadaDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: MENSAJE_EXITO })
  exito?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: MENSAJE_CORREO })
  @MaxLength(120, { message: MENSAJE_CORREO })
  correo?: string;
}
