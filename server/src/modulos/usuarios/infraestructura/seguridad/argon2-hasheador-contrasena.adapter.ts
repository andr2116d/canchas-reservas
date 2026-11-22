import { argon2id, hash } from 'argon2';
import type { HasheadorContrasena } from '../../aplicacion/hasheador-contrasena.port';
import type { Contrasena } from '../../dominio/contrasena.value-object';

// Configuración mínima de argon2id de la guía OWASP Password Storage.
const OPCIONES_OWASP = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/** Hashea contraseñas con argon2id; la sal aleatoria va dentro del hash. */
export class Argon2HasheadorContrasenaAdapter implements HasheadorContrasena {
  hashear(contrasena: Contrasena): Promise<string> {
    return hash(contrasena.texto, OPCIONES_OWASP);
  }
}
