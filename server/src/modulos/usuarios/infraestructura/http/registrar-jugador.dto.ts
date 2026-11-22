import { IsIn, IsString } from 'class-validator';
import type { DatosRegistroJugador } from '../../aplicacion/registrar-jugador.use-case';
import {
  MENSAJE_ELEGIR_TIPO_DOCUMENTO,
  TIPOS_DOCUMENTO,
} from '../../dominio/documento-identidad.value-object';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/**
 * Cuerpo de `POST /api/jugadores`. Aquí solo se exige la forma (texto y tipo
 * de documento conocido); las reglas de cada dato las valida el dominio.
 */
export class RegistrarJugadorDto implements DatosRegistroJugador {
  @IsString(COMO_TEXTO)
  nombres: string;

  @IsString(COMO_TEXTO)
  apellidos: string;

  @IsString(COMO_TEXTO)
  fechaNacimiento: string;

  @IsIn(TIPOS_DOCUMENTO, { message: MENSAJE_ELEGIR_TIPO_DOCUMENTO })
  tipoDocumento: string;

  @IsString(COMO_TEXTO)
  numeroDocumento: string;

  @IsString(COMO_TEXTO)
  correo: string;

  @IsString(COMO_TEXTO)
  celular: string;

  @IsString(COMO_TEXTO)
  contrasena: string;
}
