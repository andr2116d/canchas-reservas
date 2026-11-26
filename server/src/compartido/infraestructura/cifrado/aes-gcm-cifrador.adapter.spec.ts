import { randomBytes } from 'node:crypto';
import { AesGcmCifradorAdapter } from './aes-gcm-cifrador.adapter';

function unCifrador(
  claveCifrado = randomBytes(32),
  claveHash = randomBytes(32),
) {
  return new AesGcmCifradorAdapter(claveCifrado, claveHash);
}

describe('AesGcmCifradorAdapter', () => {
  it('recupera el texto original, con tildes y eñes', () => {
    const cifrador = unCifrador();

    const cifrado = cifrador.cifrar('Peña Ñique, José');

    expect(cifrador.descifrar(cifrado)).toBe('Peña Ñique, José');
  });

  it('recupera también un texto vacío', () => {
    const cifrador = unCifrador();

    expect(cifrador.descifrar(cifrador.cifrar(''))).toBe('');
  });

  it('rechaza un valor sin el formato esperado', () => {
    expect(() => unCifrador().descifrar('texto-plano')).toThrow(
      'El valor cifrado no tiene un formato reconocido.',
    );
  });

  it('no deja el texto legible en el valor cifrado', () => {
    const cifrado = unCifrador().cifrar('valeria.leon@gmail.com');

    expect(cifrado).not.toContain('valeria');
    expect(cifrado.startsWith('v1:')).toBe(true);
  });

  it('produce un valor distinto cada vez, para no revelar datos repetidos', () => {
    const cifrador = unCifrador();

    expect(cifrador.cifrar('45678912')).not.toBe(cifrador.cifrar('45678912'));
  });

  it('rechaza un valor alterado', () => {
    const cifrador = unCifrador();
    const partes = cifrador.cifrar('987654321').split(':');
    const alterado = Buffer.from(partes[3], 'base64');
    alterado[0] ^= 1;
    partes[3] = alterado.toString('base64');

    expect(() => cifrador.descifrar(partes.join(':'))).toThrow();
  });

  it('no descifra con otra clave', () => {
    const cifrado = unCifrador().cifrar('987654321');

    expect(() => unCifrador().descifrar(cifrado)).toThrow();
  });

  it('da el mismo hash para el mismo texto y la misma clave', () => {
    const claveHash = randomBytes(32);
    const primero = unCifrador(randomBytes(32), claveHash);
    const segundo = unCifrador(randomBytes(32), claveHash);

    expect(primero.hashParaBuscar('ana@gmail.com')).toBe(
      segundo.hashParaBuscar('ana@gmail.com'),
    );
  });

  it('da otro hash si cambia la clave de hash', () => {
    expect(unCifrador().hashParaBuscar('ana@gmail.com')).not.toBe(
      unCifrador().hashParaBuscar('ana@gmail.com'),
    );
  });

  it('exige claves de 32 bytes', () => {
    expect(() => unCifrador(randomBytes(16))).toThrow(
      'La clave de cifrado debe tener 32 bytes.',
    );
    expect(() => unCifrador(randomBytes(32), randomBytes(8))).toThrow(
      'La clave de hash debe tener 32 bytes.',
    );
  });
});
