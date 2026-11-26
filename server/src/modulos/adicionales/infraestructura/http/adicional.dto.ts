import { IsOptional, IsString } from 'class-validator';
import type { DatosDeAdicional } from '../../dominio/adicional.entity';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Cuerpo de `POST` y `PUT /api/adicionales`; las reglas de cada dato las valida el dominio. */
export class AdicionalDto implements DatosDeAdicional {
  @IsString(COMO_TEXTO)
  nombre: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  descripcion?: string;

  /** Como texto, para no perder céntimos: «15» o «15.50». */
  @IsString({ message: 'Ingresa el precio como texto, por ejemplo «15.50».' })
  precio: string;
}
