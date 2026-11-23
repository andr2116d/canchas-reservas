import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { DocumentoIdentidad } from './documento-identidad.value-object';

describe('DocumentoIdentidad', () => {
  describe('DNI', () => {
    it('acepta exactamente 8 dígitos', () => {
      const documento = DocumentoIdentidad.crear('DNI', '45678912');

      expect(documento.tipo).toBe('DNI');
      expect(documento.numero).toBe('45678912');
    });

    it('conserva los ceros iniciales y quita espacios de los extremos', () => {
      const documento = DocumentoIdentidad.crear('DNI', ' 01234567 ');

      expect(documento.numero).toBe('01234567');
    });

    it.each([
      ['4567891A', 'El DNI solo debe contener números.'],
      ['ABCDEFGH', 'El DNI solo debe contener números.'],
      ['4567-891', 'El DNI solo debe contener números.'],
      ['1234567', 'El DNI debe tener 8 dígitos.'],
      ['123456789', 'El DNI debe tener 8 dígitos.'],
      ['', 'Ingresa el número de documento.'],
      ['   ', 'Ingresa el número de documento.'],
    ])('rechaza "%s" con el mensaje: %s', (numero, mensaje) => {
      expect(() => DocumentoIdentidad.crear('DNI', numero)).toThrow(
        new ValorInvalidoError(mensaje),
      );
    });
  });

  describe('carné de extranjería', () => {
    it.each(['001234567', 'AB1234567', '123456789012'])(
      'acepta "%s" (de 9 a 12 letras o números)',
      (numero) => {
        const documento = DocumentoIdentidad.crear('CARNE_EXTRANJERIA', numero);

        expect(documento.numero).toBe(numero);
      },
    );

    it('guarda las letras en mayúscula', () => {
      const documento = DocumentoIdentidad.crear(
        'CARNE_EXTRANJERIA',
        'ab1234567',
      );

      expect(documento.numero).toBe('AB1234567');
    });

    it.each([
      ['AB-123456', 'El carné de extranjería solo admite letras y números.'],
      ['AB 1234567', 'El carné de extranjería solo admite letras y números.'],
      ['ÑB1234567', 'El carné de extranjería solo admite letras y números.'],
      [
        '12345678',
        'El carné de extranjería debe tener entre 9 y 12 caracteres.',
      ],
      [
        '1234567890123',
        'El carné de extranjería debe tener entre 9 y 12 caracteres.',
      ],
    ])('rechaza "%s" con el mensaje: %s', (numero, mensaje) => {
      expect(() =>
        DocumentoIdentidad.crear('CARNE_EXTRANJERIA', numero),
      ).toThrow(new ValorInvalidoError(mensaje));
    });
  });

  it('se identifica por su tipo y su número juntos', () => {
    const documento = DocumentoIdentidad.crear(
      'CARNE_EXTRANJERIA',
      'ab1234567',
    );

    expect(documento.identificador()).toBe('CARNE_EXTRANJERIA:AB1234567');
  });

  it('rechaza un tipo de documento que no existe', () => {
    expect(() => DocumentoIdentidad.crear('PASAPORTE', '123456789')).toThrow(
      new ValorInvalidoError('Elige el tipo de documento.'),
    );
  });
});
