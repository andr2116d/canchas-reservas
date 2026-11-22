import { randomBytes } from 'node:crypto';
import { argon2id, hash, verify } from 'argon2';
import type { HasheadorContrasena } from '../../aplicacion/hasheador-contrasena.port';
import type { Contrasena } from '../../dominio/contrasena.value-object';

// Configuración mínima de argon2id de la guía OWASP Password Storage.
const OPCIONES_OWASP = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Hashea contraseñas con argon2id; la sal aleatoria va dentro del hash. */
export class Argon2HasheadorContrasenaAdapter implements HasheadorContrasena {
  private hashDeRelleno?: Promise<string>;

  hashear(contrasena: Contrasena): Promise<string> {
    return hash(contrasena.texto, OPCIONES_OWASP);
  }

  async verificar(texto: string, hashGuardado?: string): Promise<boolean> {
    if (hashGuardado) return verify(hashGuardado, texto);
    this.hashDeRelleno ??= hash(randomBytes(32), OPCIONES_OWASP);
    await verify(await this.hashDeRelleno, texto);
    return false;
  }
}
