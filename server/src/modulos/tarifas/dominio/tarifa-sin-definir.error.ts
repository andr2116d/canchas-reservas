import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { NOMBRE_DEL_TIPO, type TipoDeCancha } from './tipo-de-cancha';

/** El tipo de cancha todavía no tiene tarifa: no se puede calcular un precio. */
export class TarifaSinDefinirError extends ConflictoError {
  constructor(tipo: TipoDeCancha) {
    super(`Todavía no hay tarifa para ${NOMBRE_DEL_TIPO[tipo]}.`, {});
  }
}
