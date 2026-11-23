import { IsString } from 'class-validator';
import { COMO_TEXTO } from './datos-personales.dto';

/** Contraseña temporal que el administrador escribe o genera. */
export class ContrasenaTemporalDto {
  @IsString(COMO_TEXTO)
  contrasena: string;
}
