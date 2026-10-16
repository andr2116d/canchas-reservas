import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export const MENSAJE_FILTRO_ACTIVO = 'El filtro activo debe ser true o false';

export class ListarAdicionalesDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: MENSAJE_FILTRO_ACTIVO })
  activo?: boolean;
}
