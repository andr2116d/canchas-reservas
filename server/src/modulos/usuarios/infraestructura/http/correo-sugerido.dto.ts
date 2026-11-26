import { IsString, Length } from 'class-validator';
import { COMO_TEXTO } from './datos-personales.dto';

/** Consulta de `GET /api/recepcionistas/correo-sugerido`. */
export class CorreoSugeridoDto {
  @IsString(COMO_TEXTO)
  @Length(1, 100, { message: 'Escribe los nombres.' })
  nombres: string;

  @IsString(COMO_TEXTO)
  @Length(1, 100, { message: 'Escribe los apellidos.' })
  apellidos: string;
}
