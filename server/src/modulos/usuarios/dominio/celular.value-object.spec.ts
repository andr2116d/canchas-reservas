import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Celular } from './celular.value-object';

describe('Celular', () => {
  it('acepta 9 dígitos que empiezan con 9', () => {
    const celular = Celular.crear('987654321');

    expect(celular.numero).toBe('987654321');
  });

  it('quita espacios de los extremos', () => {
    expect(Celular.crear(' 987654321 ').numero).toBe('987654321');
  });

  it.each([
    ['98765432A', 'El celular solo debe contener números.'],
    ['+51987654321', 'El celular solo debe contener números.'],
    ['987 654 321', 'El celular solo debe contener números.'],
    ['044123456', 'El celular debe empezar con 9.'],
    ['812345678', 'El celular debe empezar con 9.'],
    ['98765432', 'El celular debe tener 9 dígitos.'],
    ['9876543210', 'El celular debe tener 9 dígitos.'],
    ['', 'Ingresa tu número de celular.'],
  ])('rechaza "%s" con el mensaje: %s', (numero, mensaje) => {
    expect(() => Celular.crear(numero)).toThrow(new ValorInvalidoError(mensaje));
  });
});
