import { verify } from 'argon2';
import { Contrasena } from '../../dominio/contrasena.value-object';
import { Argon2HasheadorContrasenaAdapter } from './argon2-hasheador-contrasena.adapter';

describe('Argon2HasheadorContrasenaAdapter', () => {
  const hasheador = new Argon2HasheadorContrasenaAdapter();

  it('usa argon2id con el mínimo recomendado por OWASP', async () => {
    const hash = await hasheador.hashear(Contrasena.crear('pichanga10'));

    expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
  });

  it('genera un hash que verifica la contraseña y no la contiene', async () => {
    const hash = await hasheador.hashear(Contrasena.crear('pichanga10'));

    expect(hash).not.toContain('pichanga10');
    await expect(verify(hash, 'pichanga10')).resolves.toBe(true);
    await expect(verify(hash, 'pichanga11')).resolves.toBe(false);
  });

  it('da hashes distintos para la misma contraseña por su sal aleatoria', async () => {
    const contrasena = Contrasena.crear('pichanga10');

    const [primero, segundo] = await Promise.all([
      hasheador.hashear(contrasena),
      hasheador.hashear(contrasena),
    ]);

    expect(primero).not.toBe(segundo);
  });
});
