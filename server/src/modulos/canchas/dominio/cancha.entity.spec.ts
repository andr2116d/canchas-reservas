import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { unaCanchaValida } from '../../../../test/canchas/fabricas/datos-cancha';
import { Cancha, type DatosDeCancha } from './cancha.entity';

function erroresAlCrear(datos: DatosDeCancha): Record<string, string> {
  try {
    Cancha.crear(datos);
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
  throw new Error('Se esperaba un error de validación.');
}

describe('Cancha', () => {
  it('una cancha nueva empieza operativa', () => {
    const cancha = Cancha.crear(unaCanchaValida());

    expect(cancha.ficha.estado).toBe('OPERATIVA');
  });

  it('guarda el nombre limpio, el tipo, la luz y la nota vacía como ausente', () => {
    const { ficha } = Cancha.crear(unaCanchaValida({ nombre: ' La  Grande ' }));

    expect(ficha).toMatchObject({
      nombre: 'La Grande',
      tipo: 'FUTBOL_5',
      tieneIluminacion: true,
      nota: null,
    });
  });

  it('ordena los detalles según la lista y no los repite', () => {
    const { ficha } = Cancha.crear(
      unaCanchaValida({
        caracteristicas: ['MALLA_ALTA', 'TECHADA', 'TECHADA'],
      }),
    );

    expect(ficha.caracteristicas).toEqual(['TECHADA', 'MALLA_ALTA']);
  });

  it('informa a la vez cada dato que falta o no es válido', () => {
    const errores = erroresAlCrear(
      unaCanchaValida({
        nombre: '',
        tipo: 'FUTBOL_11',
        caracteristicas: ['PISCINA'],
        nota: 'x'.repeat(201),
      }),
    );

    expect(errores).toEqual({
      nombre: 'Ingresa el nombre de la cancha.',
      tipo: 'Elige si es de fútbol 5 o de fútbol 7.',
      caracteristicas: 'Elige los detalles de la lista.',
      nota: 'Usa como máximo 200 caracteres.',
    });
  });

  it('al editar devuelve solo lo que cambió, con el valor anterior y el nuevo', () => {
    const cancha = Cancha.crear(unaCanchaValida());

    const cambios = cancha.editar(
      unaCanchaValida({ nombre: 'Cancha Uno', tieneIluminacion: false }),
    );

    expect(cambios).toEqual({
      nombre: { antes: 'Cancha 1', despues: 'Cancha Uno' },
      tieneIluminacion: { antes: true, despues: false },
    });
    expect(cancha.ficha.nombre).toBe('Cancha Uno');
  });

  it('editar con los mismos datos no cambia nada', () => {
    const cancha = Cancha.crear(unaCanchaValida());

    expect(cancha.editar(unaCanchaValida({ nombre: 'Cancha  1' }))).toEqual({});
  });

  it('editar con datos inválidos no altera la cancha', () => {
    const cancha = Cancha.crear(unaCanchaValida());

    expect(() => cancha.editar(unaCanchaValida({ nombre: '' }))).toThrow(
      ReglaInvalidaError,
    );
    expect(cancha.ficha.nombre).toBe('Cancha 1');
  });

  it('se desactiva y se reactiva', () => {
    const cancha = Cancha.crear(unaCanchaValida());

    cancha.desactivar();
    expect(cancha.ficha.estado).toBe('DESACTIVADA');
    cancha.reactivar();
    expect(cancha.ficha.estado).toBe('OPERATIVA');
  });

  it('no desactiva una cancha ya desactivada ni reactiva una operativa', () => {
    const cancha = Cancha.crear(unaCanchaValida());

    expect(() => cancha.reactivar()).toThrow(
      new ConflictoError('La cancha ya está operativa.', {}),
    );
    cancha.desactivar();
    expect(() => cancha.desactivar()).toThrow('La cancha ya está desactivada.');
  });
});
