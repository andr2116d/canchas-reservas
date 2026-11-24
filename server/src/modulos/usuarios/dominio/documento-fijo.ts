import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import type { DocumentoIdentidad } from './documento-identidad.value-object';

export const DOCUMENTO_FIJO =
  'El documento identifica a la persona y no se puede cambiar.';

/** Rechaza un documento distinto del que ya tiene la cuenta. */
export function exigirMismoDocumento(
  actual: DocumentoIdentidad,
  {
    tipoDocumento,
    numeroDocumento,
  }: { tipoDocumento?: string; numeroDocumento?: string },
): void {
  const cambiaTipo =
    tipoDocumento !== undefined && tipoDocumento !== actual.tipo;
  const cambiaNumero =
    numeroDocumento !== undefined && numeroDocumento.trim() !== actual.numero;
  if (cambiaTipo || cambiaNumero)
    throw new ReglaInvalidaError({ numeroDocumento: DOCUMENTO_FIJO });
}
