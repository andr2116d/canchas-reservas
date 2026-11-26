import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Contrasena } from '../dominio/contrasena.value-object';
import {
  type ContrasenaTemporal,
  vencimientoDeTemporal,
} from '../dominio/contrasena-temporal';
import { RecepcionistaNoEncontradaError } from '../dominio/recepcionista-no-encontrada.error';
import type {
  AccionRegistrada,
  CambiosDeRecepcionista,
  RecepcionistaRepository,
} from '../dominio/recepcionista.repository';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

export type RepositorioDeCambios = Pick<
  RecepcionistaRepository,
  'actualizar' | 'buscar'
>;

interface CambioAuditado {
  id: number;
  cambios: CambiosDeRecepcionista;
  accion: AccionRegistrada;
  /** Qué decir si la cuenta existe pero no está en el estado esperado. */
  siNoAplica: string;
}

/** Aplica el cambio con su auditoría; si no se aplicó, explica por qué. */
export async function aplicarCambioAuditado(
  recepcionistas: RepositorioDeCambios,
  { id, cambios, accion, siNoAplica }: CambioAuditado,
): Promise<void> {
  if (await recepcionistas.actualizar(id, cambios, accion)) return;
  if (!(await recepcionistas.buscar(id))) {
    throw new RecepcionistaNoEncontradaError();
  }
  throw new ConflictoError(siNoAplica, {});
}

/**
 * Valida la contraseña temporal que escribe o genera el administrador, la
 * hashea y fija hasta cuándo sirve.
 */
export async function prepararContrasenaTemporal(
  texto: string,
  hasheador: HasheadorContrasena,
  ahora: Date,
): Promise<ContrasenaTemporal> {
  const { contrasena } = validarCampos({
    contrasena: () => Contrasena.crear(texto),
  });
  return {
    hash: await hasheador.hashear(contrasena),
    venceEn: vencimientoDeTemporal(ahora),
  };
}
