import { IsString } from 'class-validator';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Cuerpo de `POST /api/libro-de-reclamaciones/seguimiento`. Va en el cuerpo y no en la URL para no dejar el código en registros. */
export class SeguimientoDto {
  @IsString(COMO_TEXTO) numero: string;
  @IsString(COMO_TEXTO) codigo: string;
}
