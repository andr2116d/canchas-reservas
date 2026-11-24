import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { unAdicionalValido } from '../../../../test/fabricas/datos-adicional';
import { Adicional, type DatosDeAdicional } from './adicional.entity';

function erroresAlCrear(datos: DatosDeAdicional): Record<string, string> {
  try {
    Adicional.crear(datos);
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
  throw new Error('Se esperaba un error de validación.');
}

describe('Adicional', () => {
  it('uno nuevo empieza activo, con el nombre limpio y el precio en soles', () => {
    const adicional = Adicional.crear(
      unAdicionalValido({ nombre: ' Chalecos ', precio: '15,5' }),
    );

    expect(adicional.resumen).toEqual({
      nombre: 'Chalecos',
      descripcion: 'N.º 5, cuero sintético.',
      precio: '15.50',
    });
    expect(adicional.ficha.estado).toBe('ACTIVO');
  });

  it('una descripción vacía queda como ausente', () => {
    const adicional = Adicional.crear(unAdicionalValido({ descripcion: '  ' }));

    expect(adicional.resumen.descripcion).toBeNull();
  });

  it('informa a la vez cada dato que falta o no es válido', () => {
    expect(
      erroresAlCrear({ nombre: '', descripcion: 'x'.repeat(201), precio: '' }),
    ).toEqual({
      nombre: 'Ingresa el nombre del adicional.',
      descripcion: 'Usa como máximo 200 caracteres.',
      precio: 'Ingresa el monto.',
    });
  });

  it.each([
    ['0', 'El monto debe ser mayor que cero.'],
    ['0.00', 'El monto debe ser mayor que cero.'],
    ['-5', 'Ingresa el monto en soles, por ejemplo 50 o 49.90.'],
    ['diez', 'Ingresa el monto en soles, por ejemplo 50 o 49.90.'],
    ['1.999', 'Usa como máximo dos decimales.'],
  ])('rechaza el precio «%s»', (precio, mensaje) => {
    expect(erroresAlCrear(unAdicionalValido({ precio }))).toEqual({
      precio: mensaje,
    });
  });

  describe('al editar', () => {
    it('devuelve el valor anterior y el nuevo de lo que cambió', () => {
      const adicional = Adicional.crear(unAdicionalValido());

      const cambios = adicional.editar(
        unAdicionalValido({ nombre: 'Pelota', precio: '50' }),
      );

      expect(cambios).toEqual({
        nombre: { antes: 'Balón', despues: 'Pelota' },
        precio: { antes: '45.00', despues: '50.00' },
      });
      expect(adicional.resumen.precio).toBe('50.00');
    });

    it('el mismo precio escrito de otra forma no es un cambio', () => {
      const adicional = Adicional.crear(unAdicionalValido({ precio: '45' }));

      expect(adicional.editar(unAdicionalValido({ precio: '45,00' }))).toEqual(
        {},
      );
    });

    it('con datos inválidos no cambia nada', () => {
      const adicional = Adicional.crear(unAdicionalValido());

      expect(() =>
        adicional.editar(unAdicionalValido({ precio: '0' })),
      ).toThrow(ReglaInvalidaError);
      expect(adicional.resumen.precio).toBe('45.00');
    });

    it('conserva su estado', () => {
      const adicional = Adicional.crear(unAdicionalValido());
      adicional.desactivar();

      adicional.editar(unAdicionalValido({ precio: '60' }));

      expect(adicional.ficha.estado).toBe('DESACTIVADO');
    });
  });

  describe('desactivar y reactivar', () => {
    it('desactiva y dice que cambió', () => {
      const adicional = Adicional.crear(unAdicionalValido());

      expect(adicional.desactivar()).toBe(true);
      expect(adicional.ficha.estado).toBe('DESACTIVADO');
    });

    it('desactivar uno ya desactivado no falla ni cambia nada', () => {
      const adicional = Adicional.crear(unAdicionalValido());
      adicional.desactivar();

      expect(adicional.desactivar()).toBe(false);
      expect(adicional.ficha.estado).toBe('DESACTIVADO');
    });

    it('reactivar uno activo no falla ni cambia nada', () => {
      const adicional = Adicional.crear(unAdicionalValido());

      expect(adicional.reactivar()).toBe(false);
    });

    it('reactiva uno desactivado', () => {
      const adicional = Adicional.crear(unAdicionalValido());
      adicional.desactivar();

      expect(adicional.reactivar()).toBe(true);
      expect(adicional.ficha.estado).toBe('ACTIVO');
    });
  });
});
