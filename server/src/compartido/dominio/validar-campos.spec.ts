import { ReglaInvalidaError } from './dominio.error';
import { ValorInvalidoError } from './valor-invalido.error';
import { validarCampos } from './validar-campos';

function rechazar(mensaje: string): never {
  throw new ValorInvalidoError(mensaje);
}

describe('validarCampos', () => {
  it('devuelve cada valor construido con el nombre de su campo', () => {
    const valores = validarCampos({
      nombre: () => 'Ana',
      edad: () => 30,
    });

    expect(valores).toEqual({ nombre: 'Ana', edad: 30 });
  });

  it('reúne en un solo error los mensajes de todos los campos inválidos', () => {
    const validar = () =>
      validarCampos({
        nombre: () => rechazar('Ingresa tu nombre.'),
        edad: () => 30,
        correo: () => rechazar('El correo no tiene un formato válido.'),
      });

    expect(validar).toThrow(ReglaInvalidaError);
    try {
      validar();
    } catch (error) {
      expect((error as ReglaInvalidaError).errores).toEqual({
        nombre: 'Ingresa tu nombre.',
        correo: 'El correo no tiene un formato válido.',
      });
    }
  });

  it('deja pasar los errores que no son de validación', () => {
    const validar = () =>
      validarCampos({
        nombre: () => {
          throw new TypeError('falla inesperada');
        },
      });

    expect(validar).toThrow(TypeError);
  });
});
