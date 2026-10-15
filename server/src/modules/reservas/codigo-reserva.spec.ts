import { generarCodigo, LARGO_CODIGO } from './codigo-reserva';

describe('generarCodigo', () => {
  it('genera 8 caracteres en mayúsculas y números', () => {
    for (let i = 0; i < 200; i++) {
      expect(generarCodigo()).toMatch(/^[A-Z0-9]{8}$/);
    }
    expect(LARGO_CODIGO).toBe(8);
  });

  it('usa todo el alfabeto, de la A al 9', () => {
    expect(generarCodigo(() => 0)).toBe('AAAAAAAA');
    expect(generarCodigo((maximo) => maximo - 1)).toBe('99999999');
  });

  it('genera códigos distintos en cada llamada', () => {
    const codigos = new Set(Array.from({ length: 500 }, () => generarCodigo()));
    expect(codigos.size).toBe(500);
  });
});
