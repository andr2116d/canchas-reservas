import { Contrasena } from '../../dominio/contrasena.value-object';
import { Correo } from '../../dominio/correo.value-object';
import {
  credencialesDePrueba,
  exigirEntornoDePrueba,
} from './administrador-de-prueba';

describe('Administrador de prueba', () => {
  it('arma un correo del dominio del local y una contraseña temporal válida', () => {
    const { correo, contrasena } = credencialesDePrueba('laprevia.pe');

    expect(correo).toMatch(/^admin\.prueba\.[a-z0-9]{6}@laprevia\.pe$/);
    expect(() => Correo.crear(correo)).not.toThrow();
    expect(() => Contrasena.crear(contrasena)).not.toThrow();
  });

  it('no repite las credenciales entre una prueba y otra', () => {
    expect(credencialesDePrueba('laprevia.pe')).not.toEqual(
      credencialesDePrueba('laprevia.pe'),
    );
  });

  it('se niega a crear cuentas de prueba en producción', () => {
    expect(() => exigirEntornoDePrueba('production')).toThrow(
      'No se crean administradores de prueba en producción.',
    );
    expect(() => exigirEntornoDePrueba('development')).not.toThrow();
    expect(() => exigirEntornoDePrueba(undefined)).not.toThrow();
  });
});
