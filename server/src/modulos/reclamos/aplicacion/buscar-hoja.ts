import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import type { HojaDeReclamacion } from '../dominio/hoja-de-reclamacion.entity';
import type { HojaRepository } from '../dominio/hoja.repository';
import { NumeroDeHoja } from '../dominio/numero-de-hoja.value-object';

/** La hoja de ese número; un número mal escrito o inexistente responde no encontrada. */
export async function buscarHoja(
  hojas: HojaRepository,
  numero: string,
): Promise<HojaDeReclamacion> {
  let leido: NumeroDeHoja;
  try {
    leido = NumeroDeHoja.leer(numero);
  } catch {
    throw new NoEncontradoError('No encontramos esa hoja.');
  }
  const hoja = await hojas.buscar(leido);
  if (!hoja) throw new NoEncontradoError('No encontramos esa hoja.');
  return hoja;
}
