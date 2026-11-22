import { ReglaInvalidaError, type ErroresPorCampo } from './dominio.error';
import { ValorInvalidoError } from './valor-invalido.error';

type Constructores<T> = { [Campo in keyof T]: () => T[Campo] };

/**
 * Construye varios objetos de valor a la vez y reúne los errores de todos, para
 * informar cada campo inválido en una sola respuesta y no de uno en uno.
 */
export function validarCampos<T extends object>(
  constructores: Constructores<T>,
): T {
  const valores: Partial<T> = {};
  const errores: ErroresPorCampo = {};

  for (const campo of Object.keys(constructores) as (keyof T)[]) {
    try {
      valores[campo] = constructores[campo]();
    } catch (error) {
      if (!(error instanceof ValorInvalidoError)) throw error;
      errores[String(campo)] = error.message;
    }
  }

  if (Object.keys(errores).length > 0) throw new ReglaInvalidaError(errores);
  return valores as T;
}
