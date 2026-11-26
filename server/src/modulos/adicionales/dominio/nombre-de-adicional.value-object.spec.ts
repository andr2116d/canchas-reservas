import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { NombreDeAdicional } from './nombre-de-adicional.value-object';

describe('NombreDeAdicional', () => {
  it('quita los espacios de más', () => {
    expect(NombreDeAdicional.crear('  Balón   N.º 5 ').valor).toBe(
      'Balón N.º 5',
    );
  });

  it('acepta los signos que suelen llevar los nombres de material', () => {
    expect(() =>
      NombreDeAdicional.crear('Chalecos (rojo/azul), talla M-L'),
    ).not.toThrow();
  });

  it('considera iguales dos nombres que solo difieren en mayúsculas o tildes', () => {
    expect(NombreDeAdicional.crear('BALON').normalizado).toBe(
      NombreDeAdicional.crear('balón').normalizado,
    );
  });

  it.each([
    ['', 'Ingresa el nombre del adicional.'],
    ['   ', 'Ingresa el nombre del adicional.'],
    ['x'.repeat(41), 'Usa como máximo 40 caracteres.'],
    [
      '<b>Balón</b>',
      "Usa solo letras, números, espacios y los signos . , - / # ' ( ) º.",
    ],
  ])('rechaza «%s»', (texto, mensaje) => {
    expect(() => NombreDeAdicional.crear(texto)).toThrow(
      new ValorInvalidoError(mensaje),
    );
  });
});
