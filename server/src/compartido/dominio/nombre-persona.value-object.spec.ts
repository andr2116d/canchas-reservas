import { ValorInvalidoError } from './valor-invalido.error';
import { NombrePersona } from './nombre-persona.value-object';

describe('NombrePersona', () => {
  it('acepta nombres con tildes, eñe y varias palabras', () => {
    expect(NombrePersona.crear('María José', 'nombres').texto).toBe(
      'María José',
    );
  });

  it('quita espacios de los extremos y une los espacios repetidos', () => {
    expect(NombrePersona.crear('  Peña   Ñique ', 'apellidos').texto).toBe(
      'Peña Ñique',
    );
  });

  it.each([
    ['nombres', 'Ingresa los nombres.'],
    ['apellidos', 'Ingresa los apellidos.'],
  ] as const)('pide %s cuando llegan vacíos', (etiqueta, mensaje) => {
    expect(() => NombrePersona.crear('   ', etiqueta)).toThrow(
      new ValorInvalidoError(mensaje),
    );
  });

  it('rechaza más de 80 caracteres', () => {
    expect(() => NombrePersona.crear('a'.repeat(81), 'nombres')).toThrow(
      new ValorInvalidoError(
        'Los nombres no pueden tener más de 80 caracteres.',
      ),
    );
  });
});
