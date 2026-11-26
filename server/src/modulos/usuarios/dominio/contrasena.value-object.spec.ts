import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Contrasena } from './contrasena.value-object';

describe('Contrasena', () => {
  it.each(['pichanga1', '12345678', 'Previa2026', 'a1'.repeat(32)])(
    'acepta "%s" (de 8 a 64 caracteres con al menos un número)',
    (texto) => {
      expect(Contrasena.crear(texto).texto).toBe(texto);
    },
  );

  it('respeta los espacios porque forman parte de la contraseña', () => {
    expect(Contrasena.crear(' pichanga 1 ').texto).toBe(' pichanga 1 ');
  });

  it.each([
    ['pichanga', 'La contraseña debe incluir al menos un número.'],
    ['sinNumeros!', 'La contraseña debe incluir al menos un número.'],
    ['corta1', 'La contraseña debe tener al menos 8 caracteres.'],
    [
      'a1'.repeat(32) + 'x',
      'La contraseña no puede tener más de 64 caracteres.',
    ],
    ['', 'Ingresa una contraseña.'],
  ])('rechaza "%s" con el mensaje: %s', (texto, mensaje) => {
    expect(() => Contrasena.crear(texto)).toThrow(
      new ValorInvalidoError(mensaje),
    );
  });

  it('no muestra la contraseña al convertirse en texto o JSON', () => {
    const contrasena = Contrasena.crear('pichanga1');

    expect(String(contrasena)).not.toContain('pichanga1');
    expect(JSON.stringify({ contrasena })).not.toContain('pichanga1');
  });
});
