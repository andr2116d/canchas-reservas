import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

export const MENSAJE_ACEPTACION_LEGAL =
  'Acepta los términos y la política de privacidad para crear tu cuenta.';
const VERSION_LEGAL_DEL_REGISTRO = 'registro-1';

/** Comprueba que el jugador aceptó la versión mostrada en el formulario. */
export function validarVersionLegal(version: string): string {
  if (!version) throw new ValorInvalidoError(MENSAJE_ACEPTACION_LEGAL);
  if (version !== VERSION_LEGAL_DEL_REGISTRO) {
    throw new ValorInvalidoError(
      'Los documentos han cambiado. Recarga la página y revísalos.',
    );
  }
  return version;
}
