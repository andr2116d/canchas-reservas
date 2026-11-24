import { normalizarNombre } from './normalizar-nombre';

describe('normalizarNombre', () => {
  it('ignora mayúsculas, tildes y espacios de más', () => {
    expect(normalizarNombre('  La   Única ')).toBe('la unica');
  });
});
