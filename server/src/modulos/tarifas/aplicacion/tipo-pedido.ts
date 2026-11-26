import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import {
  esTipoDeCancha,
  type TipoDeCancha,
} from '../../../compartido/dominio/tipo-de-cancha';

/** Lee el tipo de cancha pedido; uno que no existe responde igual que algo no encontrado. */
export function exigirTipoDeCancha(texto: string): TipoDeCancha {
  if (!esTipoDeCancha(texto)) {
    throw new NoEncontradoError('No existe ese tipo de cancha.');
  }
  return texto;
}
