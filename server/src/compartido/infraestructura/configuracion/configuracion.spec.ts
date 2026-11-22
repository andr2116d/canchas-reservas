import { leerConfiguracion } from './configuracion';

const CLAVE_DE_32_BYTES = Buffer.alloc(32, 7).toString('base64');

function unEntornoValido(cambios: Record<string, string | undefined> = {}) {
  return {
    DATABASE_URL: 'postgresql://usuario:clave@localhost:5432/base',
    CLAVE_CIFRADO: CLAVE_DE_32_BYTES,
    CLAVE_HASH: CLAVE_DE_32_BYTES,
    ...cambios,
  };
}

describe('leerConfiguracion', () => {
  it('lee las claves como bytes y aplica los valores por defecto', () => {
    const configuracion = leerConfiguracion(unEntornoValido());

    expect(configuracion.puerto).toBe(3001);
    expect(configuracion.claveCifrado).toHaveLength(32);
    expect(configuracion.cookieSegura).toBe(true);
    expect(configuracion.saltosDeProxy).toBe(1);
    expect(configuracion.limiteDeRegistrosPorHora).toBe(10);
  });

  it('permite ajustar el límite de registros por hora', () => {
    expect(
      leerConfiguracion(unEntornoValido({ LIMITE_REGISTROS_POR_HORA: '50' }))
        .limiteDeRegistrosPorHora,
    ).toBe(50);
  });

  it('solo desactiva la cookie segura en desarrollo y pruebas', () => {
    expect(
      leerConfiguracion(unEntornoValido({ NODE_ENV: 'development' }))
        .cookieSegura,
    ).toBe(false);
    expect(
      leerConfiguracion(unEntornoValido({ NODE_ENV: 'production' }))
        .cookieSegura,
    ).toBe(true);
  });

  it.each(['DATABASE_URL', 'CLAVE_CIFRADO', 'CLAVE_HASH'])(
    'falla al arrancar si falta %s',
    (variable) => {
      expect(() =>
        leerConfiguracion(unEntornoValido({ [variable]: undefined })),
      ).toThrow(`Falta la variable de entorno ${variable}.`);
    },
  );

  it('falla si una clave no mide 32 bytes', () => {
    const corta = Buffer.alloc(16).toString('base64');

    expect(() =>
      leerConfiguracion(unEntornoValido({ CLAVE_HASH: corta })),
    ).toThrow('CLAVE_HASH debe ser de 32 bytes en base64.');
  });

  it('falla si el puerto o los saltos de proxy no son números', () => {
    expect(() => leerConfiguracion(unEntornoValido({ PORT: 'abc' }))).toThrow(
      'PORT debe ser un número entero.',
    );
    expect(() =>
      leerConfiguracion(unEntornoValido({ SALTOS_PROXY: '-1' })),
    ).toThrow('SALTOS_PROXY debe ser un número entero.');
  });
});
