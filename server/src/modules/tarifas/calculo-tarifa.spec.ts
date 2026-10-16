import { Prisma } from '../../generated/prisma/client';
import {
  aCentimos,
  aNumero,
  calcularAdelanto,
  deCentimos,
} from './calculo-tarifa';

describe('calculo-tarifa', () => {
  describe('aCentimos', () => {
    it('convierte a céntimos enteros sin errores de coma flotante', () => {
      expect(aCentimos(55.05)).toBe(5505);
      expect(aCentimos(0.1 + 0.2)).toBe(30);
      expect(aCentimos('9999.99')).toBe(999999);
      expect(aCentimos(new Prisma.Decimal('80.00'))).toBe(8000);
    });
  });

  describe('deCentimos', () => {
    it('devuelve un Decimal con 2 decimales', () => {
      expect(deCentimos(2753).toFixed(2)).toBe('27.53');
      expect(deCentimos(4000).toFixed(2)).toBe('40.00');
    });
  });

  describe('calcularAdelanto', () => {
    it.each([
      ['80', '40.00'],
      ['55.05', '27.53'],
      ['0.01', '0.01'],
      ['0.03', '0.02'],
      ['10.10', '5.05'],
      ['10.11', '5.06'],
      ['9999.99', '5000.00'],
      ['0.05', '0.03'],
      ['0.99', '0.50'],
      ['99.99', '50.00'],
      ['1', '0.50'],
      ['7', '3.50'],
      ['100', '50.00'],
      ['9999', '4999.50'],
    ])('con valor %s el adelanto es %s', (valor, adelanto) => {
      const resultado = calcularAdelanto(new Prisma.Decimal(valor));
      expect(resultado).toBeInstanceOf(Prisma.Decimal);
      expect(resultado.toFixed(2)).toBe(adelanto);
    });

    it('acepta números', () => {
      expect(calcularAdelanto(55.05).toFixed(2)).toBe('27.53');
    });

    it.each([0.01, 0.03, 0.05, 55.05, 99.99, 9999.99, 7])(
      'con %s da lo mismo como número, como texto y como Decimal',
      (valor) => {
        const esperado = calcularAdelanto(new Prisma.Decimal(String(valor)));
        expect(calcularAdelanto(valor).equals(esperado)).toBe(true);
        expect(calcularAdelanto(String(valor)).equals(esperado)).toBe(true);
      },
    );
  });

  describe('aNumero', () => {
    it('devuelve el monto como número redondeado al céntimo', () => {
      expect(aNumero(new Prisma.Decimal('80.00'))).toBe(80);
      expect(aNumero(new Prisma.Decimal('55.05'))).toBe(55.05);
      expect(aNumero(27.525)).toBe(27.53);
    });
  });
});
