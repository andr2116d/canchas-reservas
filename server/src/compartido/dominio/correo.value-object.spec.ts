import { ValorInvalidoError } from './valor-invalido.error';
import { Correo } from './correo.value-object';

describe('Correo', () => {
  it.each([
    'ana@gmail.com',
    'ana.rojas+futbol@empresa.com.pe',
    'jugador_10@sub.dominio.pe',
  ])('acepta "%s"', (direccion) => {
    expect(Correo.crear(direccion).direccion).toBe(direccion);
  });

  it('guarda la dirección en minúscula y sin espacios en los extremos', () => {
    expect(Correo.crear('  Ana.Rojas@Gmail.COM ').direccion).toBe(
      'ana.rojas@gmail.com',
    );
  });

  it.each([
    'ana',
    'ana@',
    '@gmail.com',
    'ana@gmail',
    'ana@@gmail.com',
    'ana rojas@gmail.com',
    'ana@gmail..com',
    'ana@-gmail.com',
  ])('rechaza "%s" por formato', (direccion) => {
    expect(() => Correo.crear(direccion)).toThrow(
      new ValorInvalidoError('El correo no tiene un formato válido.'),
    );
  });

  it('rechaza un correo vacío', () => {
    expect(() => Correo.crear('  ')).toThrow(
      new ValorInvalidoError('Ingresa el correo.'),
    );
  });

  it('rechaza un correo de más de 254 caracteres', () => {
    const largo = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.pe`;

    expect(() => Correo.crear(largo)).toThrow(
      new ValorInvalidoError('El correo no puede tener más de 254 caracteres.'),
    );
  });
});
