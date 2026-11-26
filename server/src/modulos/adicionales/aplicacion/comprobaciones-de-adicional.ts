import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type { Adicional } from '../dominio/adicional.entity';
import { AdicionalNoEncontradoError } from '../dominio/adicional-no-encontrado.error';
import type { AdicionalRepository } from '../dominio/adicional.repository';

/** El adicional con ese id, o el error de que no existe. */
export async function buscarAdicional(
  adicionales: Pick<AdicionalRepository, 'buscar'>,
  id: number,
): Promise<Adicional> {
  const adicional = await adicionales.buscar(id);
  if (!adicional) throw new AdicionalNoEncontradoError();
  return adicional;
}

/** Error para un nombre que ya usa otro adicional; también lo usa el repositorio ante una carrera. */
export function nombreRepetido(nombre: string): ConflictoError {
  return new ConflictoError('El nombre ya lo usa otro adicional.', {
    nombre: `Ya existe un adicional llamado «${nombre}».`,
  });
}

/** Rechaza el nombre si ya lo usa otro adicional. */
export async function exigirNombreLibre(
  adicionales: Pick<AdicionalRepository, 'nombreOcupado'>,
  adicional: Adicional,
): Promise<void> {
  if (
    await adicionales.nombreOcupado(adicional.nombreNormalizado, adicional.id)
  )
    throw nombreRepetido(adicional.resumen.nombre);
}
