import { IsString } from 'class-validator';
import type { DatosEditados } from '../../aplicacion/editar-recepcionista.use-case';
import { COMO_TEXTO, DatosPersonalesDto } from './datos-personales.dto';

/** Cuerpo de `PATCH /api/recepcionistas/:id`. */
export class EditarRecepcionistaDto
  extends DatosPersonalesDto
  implements DatosEditados
{
  @IsString(COMO_TEXTO)
  usuarioDeCorreo: string;
}
