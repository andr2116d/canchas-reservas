import { CryptoGeneradorTokenSesionAdapter } from './crypto-generador-token-sesion.adapter';

describe('CryptoGeneradorTokenSesionAdapter', () => {
  const generador = new CryptoGeneradorTokenSesionAdapter();

  it('genera tokens de 32 bytes aleatorios aptos para una cookie', () => {
    const token = generador.generar();

    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('no repite tokens', () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, () => generador.generar()),
    );

    expect(tokens.size).toBe(1000);
  });

  it('da siempre el mismo hash para un token, distinto del token', () => {
    const token = generador.generar();

    expect(generador.hashear(token)).toBe(generador.hashear(token));
    expect(generador.hashear(token)).not.toBe(token);
    expect(generador.hashear(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
