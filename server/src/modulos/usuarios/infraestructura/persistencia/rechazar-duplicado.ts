import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import {
  CuentaYaExisteError,
  type DatoUnico,
} from '../../dominio/cuenta-ya-existe.error';

// Índice único de la base que corresponde a cada dato que no puede repetirse.
const DATO_POR_INDICE: Record<string, DatoUnico> = {
  usuario_documento_hash_rol_key: 'numeroDocumento',
  usuario_correo_hash_key: 'correo',
};

/**
 * Otra cuenta con el mismo dato pudo guardarse entre la verificación y la
 * escritura: traduce el índice único violado al error de dominio.
 */
export function rechazarDuplicado(
  error: unknown,
  mensajes?: Record<DatoUnico, string>,
): never {
  const dato = DATO_POR_INDICE[indiceUnicoViolado(error) ?? ''];
  if (dato) throw new CuentaYaExisteError([dato], mensajes);
  throw error;
}
