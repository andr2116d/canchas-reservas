import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { NombreDeCancha } from './nombre-de-cancha.value-object';

describe('NombreDeCancha', () => {
  it('guarda el nombre sin espacios de más', () => {
    const nombre = NombreDeCancha.crear('  Cancha   1 ');

    expect(nombre.valor).toBe('Cancha 1');
  });

  it('compara sin importar mayúsculas, tildes ni espacios', () => {
    const conTilde = NombreDeCancha.crear('La Única');
    const sinTilde = NombreDeCancha.crear('la  unica');

    expect(conTilde.normalizado).toBe(sinTilde.normalizado);
  });

  it('rechaza un nombre vacío', () => {
    expect(() => NombreDeCancha.crear('   ')).toThrow(
      new ValorInvalidoError('Ingresa el nombre de la cancha.'),
    );
  });

  it('rechaza un nombre de más de 40 caracteres', () => {
    expect(() => NombreDeCancha.crear('a'.repeat(41))).toThrow(
      'Usa como máximo 40 caracteres.',
    );
  });

  it('rechaza signos que no son parte de un nombre', () => {
    expect(() => NombreDeCancha.crear('<b>Cancha</b>')).toThrow(
      "Usa solo letras, números, espacios y los signos . - # ' ( ) º.",
    );
  });

  it('acepta letras con tilde, ñ, números y signos comunes', () => {
    expect(
      NombreDeCancha.crear('Cancha N.º 2 - La Peña (techada) #3').valor,
    ).toBe('Cancha N.º 2 - La Peña (techada) #3');
  });
});
