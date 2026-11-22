import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Datos que no pueden repetirse entre dos cuentas. */
export type DatoUnico = 'numeroDocumento' | 'correo';

const MENSAJES: Record<DatoUnico, string> = {
  numeroDocumento: 'Ya existe una cuenta con este documento.',
  correo: 'Ya existe una cuenta con este correo.',
};

/** Ya hay una cuenta con el mismo documento o el mismo correo. */
export class CuentaYaExisteError extends ConflictoError {
  constructor(readonly repetidos: DatoUnico[]) {
    super(
      'Ya existe una cuenta con estos datos.',
      Object.fromEntries(repetidos.map((dato) => [dato, MENSAJES[dato]])),
    );
  }
}
