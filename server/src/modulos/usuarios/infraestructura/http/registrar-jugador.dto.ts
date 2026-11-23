import { IsOptional, IsString } from 'class-validator';
import type { DatosRegistroJugador } from '../../aplicacion/registrar-jugador.use-case';
import { MENSAJE_ACEPTACION_LEGAL } from '../../dominio/aceptacion-legal-registro';
import { COMO_TEXTO, DatosPersonalesDto } from './datos-personales.dto';

/** Cuerpo de `POST /api/jugadores`. */
export class RegistrarJugadorDto
  extends DatosPersonalesDto
  implements DatosRegistroJugador
{
  @IsString(COMO_TEXTO)
  correo: string;

  @IsString(COMO_TEXTO)
  contrasena: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  dorsal?: string;

  @IsString({ message: MENSAJE_ACEPTACION_LEGAL })
  versionLegalAceptada: string;
}
