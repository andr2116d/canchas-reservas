import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { ErroresPorCampo } from '../../dominio/dominio.error';

// Caracteres de control, salvo la tabulación y los saltos de línea. PostgreSQL no guarda el nulo.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// Una mitad de un par sustituto sin su pareja (por ejemplo, medio emoji): no es UTF-8 válido.
const MITAD_SUELTA =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function textoValido(texto: string): boolean {
  return !CONTROL.test(texto) && !MITAD_SUELTA.test(texto);
}

function reunir(valor: unknown, ruta: string, errores: ErroresPorCampo): void {
  if (typeof valor === 'string') {
    if (!textoValido(valor)) errores[ruta] = 'Quita los caracteres no válidos.';
  } else if (valor !== null && typeof valor === 'object') {
    for (const [clave, anidado] of Object.entries(valor))
      reunir(anidado, ruta ? `${ruta}.${clave}` : clave, errores);
  }
}

/** Rechaza en el cuerpo y en la consulta el texto con caracteres de control o mal formado. */
@Injectable()
export class TextoNoValidoPipe implements PipeTransform {
  transform(valor: unknown, { type }: ArgumentMetadata): unknown {
    if (type !== 'body' && type !== 'query') return valor;
    const errores: ErroresPorCampo = {};
    reunir(valor, '', errores);
    if (Object.keys(errores).length > 0)
      throw new BadRequestException({
        mensaje: 'Revisa los datos marcados.',
        errores,
      });
    return valor;
  }
}
