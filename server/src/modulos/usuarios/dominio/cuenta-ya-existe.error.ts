import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Datos que no pueden repetirse entre dos cuentas. */
export type DatoUnico = 'numeroDocumento' | 'correo';

const MENSAJES: Record<DatoUnico, string> = {
  numeroDocumento: 'Ya existe una cuenta con este documento.',
  correo: 'Ya existe una cuenta con este correo.',
};

/** Mensajes cuando el dato repetido pertenece a una cuenta del personal. */
export const MENSAJES_DEL_PERSONAL: Record<DatoUnico, string> = {
  numeroDocumento: 'Este documento ya tiene una cuenta de recepción activa.',
  correo: 'Este correo ya fue registrado para otra cuenta del personal.',
};

/** Ya hay una cuenta con el mismo documento o el mismo correo. */
export class CuentaYaExisteError extends ConflictoError {
  constructor(
    readonly repetidos: DatoUnico[],
    mensajes: Record<DatoUnico, string> = MENSAJES,
  ) {
    super(
      'Ya existe una cuenta con estos datos.',
      Object.fromEntries(repetidos.map((dato) => [dato, mensajes[dato]])),
    );
  }
}
