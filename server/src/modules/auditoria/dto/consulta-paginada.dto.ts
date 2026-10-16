import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateBy,
} from 'class-validator';
import { FechaValida, MENSAJE_FECHA } from '../../horario/dto/vista-previa.dto';

export const TAMANO_MAXIMO = 50;
export const TAMANO_POR_DEFECTO = 20;
export const MENSAJE_PAGINA =
  'La página debe ser un número entero mayor o igual a 1';
export const MENSAJE_TAMANO = `El tamaño de página debe estar entre 1 y ${TAMANO_MAXIMO}`;
export const MENSAJE_RANGO =
  'La fecha hasta no puede ser anterior a la fecha desde';

const NoAntesDeDesde = () =>
  ValidateBy({
    name: 'noAntesDeDesde',
    validator: {
      validate: (hasta: unknown, argumentos) => {
        const objeto = argumentos?.object as { desde?: unknown } | undefined;
        const desde = objeto?.desde;
        return (
          typeof desde !== 'string' ||
          typeof hasta !== 'string' ||
          desde <= hasta
        );
      },
      defaultMessage: () => MENSAJE_RANGO,
    },
  });

export class ConsultaPaginadaDto {
  @IsOptional()
  @FechaValida()
  @IsString({ message: MENSAJE_FECHA })
  desde?: string;

  @IsOptional()
  @NoAntesDeDesde()
  @FechaValida()
  @IsString({ message: MENSAJE_FECHA })
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: MENSAJE_PAGINA })
  @Min(1, { message: MENSAJE_PAGINA })
  @Max(1_000_000, { message: MENSAJE_PAGINA })
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: MENSAJE_TAMANO })
  @Min(1, { message: MENSAJE_TAMANO })
  @Max(TAMANO_MAXIMO, { message: MENSAJE_TAMANO })
  tamano: number = TAMANO_POR_DEFECTO;
}
