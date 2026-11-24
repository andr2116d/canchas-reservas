import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { DatosDeCancha } from '../../dominio/cancha.entity';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };
const MAXIMO_POR_ALTA = 20;

/** Una cancha; las reglas de cada dato las valida el dominio. */
export class CanchaDto implements DatosDeCancha {
  @IsString(COMO_TEXTO)
  nombre: string;

  @IsString({ message: 'Elige si es de fútbol 5 o de fútbol 7.' })
  tipo: string;

  @IsBoolean({ message: 'Indica si tiene iluminación para la noche.' })
  tieneIluminacion: boolean;

  @IsArray({ message: 'Indica los detalles como una lista.' })
  @ArrayMaxSize(10, { message: 'Elige los detalles de la lista.' })
  @IsString({ each: true, message: 'Elige los detalles de la lista.' })
  caracteristicas: string[];

  @IsOptional()
  @IsString(COMO_TEXTO)
  nota?: string;
}

/** Cuerpo de `POST /api/canchas`: una o varias canchas que se crean juntas. */
export class RegistrarCanchasDto {
  @IsArray({ message: 'Indica las canchas como una lista.' })
  @ArrayMinSize(1, { message: 'Agrega al menos una cancha.' })
  @ArrayMaxSize(MAXIMO_POR_ALTA, {
    message: `Agrega como máximo ${MAXIMO_POR_ALTA} canchas a la vez.`,
  })
  @ValidateNested({ each: true })
  @Type(() => CanchaDto)
  canchas: CanchaDto[];
}
