import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';
import type { Cifrador } from '../../aplicacion/cifrador.port';

const ALGORITMO = 'aes-256-gcm';
const BYTES_CLAVE = 32;
// Largo de IV recomendado para GCM (NIST SP 800-38D).
const BYTES_IV = 12;
// La versión permite rotar la clave sin perder lo cifrado antes.
const VERSION = 'v1';

function exigirLargo(clave: Buffer, nombre: string): void {
  if (clave.length !== BYTES_CLAVE) {
    throw new Error(`La clave de ${nombre} debe tener ${BYTES_CLAVE} bytes.`);
  }
}

/**
 * Cifra con AES-256-GCM (confidencialidad e integridad) y calcula hashes de
 * búsqueda con HMAC-SHA256 usando otra clave. Formato: `v1:iv:tag:datos` en base64.
 */
export class AesGcmCifradorAdapter implements Cifrador {
  constructor(
    private readonly claveCifrado: Buffer,
    private readonly claveHash: Buffer,
  ) {
    exigirLargo(claveCifrado, 'cifrado');
    exigirLargo(claveHash, 'hash');
  }

  cifrar(texto: string): string {
    const iv = randomBytes(BYTES_IV);
    const cifrador = createCipheriv(ALGORITMO, this.claveCifrado, iv);
    const datos = Buffer.concat([
      cifrador.update(texto, 'utf8'),
      cifrador.final(),
    ]);
    const etiqueta = cifrador.getAuthTag();
    return [VERSION, iv, etiqueta, datos]
      .map((parte) =>
        typeof parte === 'string' ? parte : parte.toString('base64'),
      )
      .join(':');
  }

  descifrar(cifrado: string): string {
    const partes = cifrado.split(':');
    const [version, iv, etiqueta, datos] = partes;
    if (partes.length !== 4 || version !== VERSION) {
      throw new Error('El valor cifrado no tiene un formato reconocido.');
    }
    const descifrador = createDecipheriv(
      ALGORITMO,
      this.claveCifrado,
      Buffer.from(iv, 'base64'),
    );
    descifrador.setAuthTag(Buffer.from(etiqueta, 'base64'));
    return Buffer.concat([
      descifrador.update(Buffer.from(datos, 'base64')),
      descifrador.final(),
    ]).toString('utf8');
  }

  hashParaBuscar(texto: string): string {
    return createHmac('sha256', this.claveHash)
      .update(texto, 'utf8')
      .digest('hex');
  }
}
