import { IsIn, IsString } from 'class-validator';
import type { DatosPersonalesEscritos } from '../../aplicacion/datos-personales';
import {
  MENSAJE_ELEGIR_TIPO_DOCUMENTO,
  TIPOS_DOCUMENTO,
} from '../../dominio/documento-identidad.value-object';

export const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/**
 * Datos personales comunes a jugadores y personal. Aquí solo se exige la forma
 * (texto y tipo de documento conocido); las reglas de cada dato las valida el dominio.
 */
export class DatosPersonalesDto implements DatosPersonalesEscritos {
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
  celular: string;
}
