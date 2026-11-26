import { IsString } from 'class-validator';
import type { DatosDeRecepcionista } from '../../aplicacion/registrar-recepcionista.use-case';
import { COMO_TEXTO, DatosPersonalesDto } from './datos-personales.dto';

/** Cuerpo de `POST /api/recepcionistas`. */
export class RegistrarRecepcionistaDto
  extends DatosPersonalesDto
  implements DatosDeRecepcionista
{
  @IsString(COMO_TEXTO)
  usuarioDeCorreo: string;

  @IsString(COMO_TEXTO)
  contrasena: string;
}
