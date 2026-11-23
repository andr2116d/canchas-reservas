import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Correo } from './correo.value-object';

// Parte de un correo antes de la @ (estándar HTML de WHATWG).
const USUARIO_DE_CORREO = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;

/**
 * El personal del local usa el dominio corporativo y el jugador, su correo
 * personal. Así una misma persona puede tener las dos cuentas sin confundirlas.
 */
export class ReglasDeCorreo {
  constructor(readonly dominioCorporativo: string) {}

  correspondeAlRol(rol: RolUsuario, correo: Correo): boolean {
    const esCorporativo =
      correo.direccion.split('@')[1] === this.dominioCorporativo;
    return rol === 'JUGADOR' ? !esCorporativo : esCorporativo;
  }

  /** Devuelve el correo si corresponde al rol; si no, explica qué correo usar. */
  exigirParaRol(rol: RolUsuario, correo: Correo): Correo {
    if (this.correspondeAlRol(rol, correo)) return correo;
    throw new ValorInvalidoError(
      rol === 'JUGADOR'
        ? `Usa tu correo personal: @${this.dominioCorporativo} es solo para el personal del local.`
        : `Usa un correo @${this.dominioCorporativo}.`,
    );
  }

  /** Arma el correo del personal con lo que va antes de la @. */
  institucional(usuario: string): Correo {
    const normalizado = usuario.trim().toLowerCase();
    if (!USUARIO_DE_CORREO.test(normalizado)) {
      throw new ValorInvalidoError(
        'Escribe solo lo que va antes de la @, sin espacios.',
      );
    }
    return Correo.crear(`${normalizado}@${this.dominioCorporativo}`);
  }
}
