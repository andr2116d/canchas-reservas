import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { Bloqueo, type DatosDelBloqueo } from './bloqueo.entity';

const hora = (texto: string) => new Date(`2026-11-28T${texto}:00.000-05:00`);

function unBloqueo(cambios: Partial<DatosDelBloqueo> = {}): DatosDelBloqueo {
  return {
    canchaId: 1,
    tipo: 'PROGRAMADO',
    inicio: hora('08:00'),
    fin: hora('14:00'),
    motivo: 'Peinado del césped.',
    ...cambios,
  };
}

describe('Bloqueo', () => {
  it('guarda el motivo sin espacios de más', () => {
    expect(
      Bloqueo.crear(unBloqueo({ motivo: '  Fumigación ' })).ficha.motivo,
    ).toBe('Fumigación');
  });

  it('exige el motivo, el tipo y un fin posterior al inicio', () => {
    expect(() =>
      Bloqueo.crear(
        unBloqueo({ motivo: ' ', tipo: 'OTRO', fin: hora('08:00') }),
      ),
    ).toThrow(
      expect.objectContaining({
        errores: {
          motivo: 'Escribe el motivo del bloqueo.',
          tipo: 'Elige si es programado o de emergencia.',
          hasta: 'El fin debe ser después del inicio.',
        },
      }),
    );
  });

  it('limita el motivo a 200 caracteres', () => {
    expect(() => Bloqueo.crear(unBloqueo({ motivo: 'x'.repeat(201) }))).toThrow(
      expect.objectContaining({
        errores: { motivo: 'Usa como máximo 200 caracteres.' },
      }),
    );
  });

  it('sabe si está por empezar, en curso o terminado', () => {
    const bloqueo = Bloqueo.crear(unBloqueo());

    expect(bloqueo.etapa(hora('07:59'))).toBe('PROXIMO');
    expect(bloqueo.etapa(hora('08:00'))).toBe('EN_CURSO');
    expect(bloqueo.etapa(hora('14:00'))).toBe('TERMINADO');
  });

  it('liberar uno en curso lo termina en ese minuto', () => {
    const bloqueo = Bloqueo.crear(unBloqueo());

    bloqueo.liberar(new Date('2026-11-28T12:05:42.000-05:00'));

    expect(bloqueo.finEfectivo).toEqual(hora('12:05'));
    expect(bloqueo.etapa(hora('12:06'))).toBe('TERMINADO');
  });

  it('solo se libera uno en curso y solo se quita uno que no empezó', () => {
    const bloqueo = Bloqueo.crear(unBloqueo());

    expect(() => bloqueo.liberar(hora('07:00'))).toThrow(
      new ConflictoError(
        'El bloqueo aún no empieza: quítalo en lugar de liberarlo.',
        {},
      ),
    );
    expect(() => bloqueo.exigirQueNoEmpezo(hora('09:00'))).toThrow(
      'El bloqueo ya empezó: libéralo desde ahora.',
    );
    expect(() => bloqueo.liberar(hora('15:00'))).toThrow(
      'El bloqueo ya terminó.',
    );
  });
});
