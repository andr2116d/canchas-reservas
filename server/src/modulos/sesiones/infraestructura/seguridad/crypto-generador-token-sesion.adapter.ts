import { createHash, randomBytes } from 'node:crypto';
import type { GeneradorTokenSesion } from '../../aplicacion/generador-token-sesion.port';

// 32 bytes = 256 bits de entropía, por encima del mínimo de 64 bits de OWASP.
const BYTES_DEL_TOKEN = 32;

/**
 * Tokens aleatorios con `node:crypto`. Por su entropía basta SHA-256 para
 * guardarlos: no hace falta un hash lento como en las contraseñas.
 */
export class CryptoGeneradorTokenSesionAdapter implements GeneradorTokenSesion {
  generar(): string {
    return randomBytes(BYTES_DEL_TOKEN).toString('base64url');
  }

  hashear(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
