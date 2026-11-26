import { HorarioDelDia } from './horario-del-dia';
import { generarTurnos } from './turnos-del-dia';

const dia = (abre: string, cierra: string) =>
  HorarioDelDia.crear({ abre, cierra });
const textos = (turnos: { desde: number; hasta: number }[]) =>
  turnos.map(
    ({ desde, hasta }) =>
      `${String(desde / 60).padStart(2, '0')}-${String(hasta / 60).padStart(2, '0')}`,
  );

describe('generarTurnos', () => {
  it('de 08:00 a 22:00 con turnos de 1 hora salen 14 turnos seguidos', () => {
    const { turnos, sinTurno } = generarTurnos(
      dia('08:00', '22:00'),
      60,
      false,
    );

    expect(turnos).toHaveLength(14);
    expect(textos(turnos).slice(0, 2)).toEqual(['08-09', '09-10']);
    expect(textos(turnos).at(-1)).toBe('21-22');
    expect(sinTurno).toBeUndefined();
  });

  it('el rato que no alcanza para un turno no se ofrece y se informa', () => {
    const { turnos, sinTurno } = generarTurnos(
      dia('08:00', '22:00'),
      180,
      false,
    );

    expect(textos(turnos)).toEqual(['08-11', '11-14', '14-17', '17-20']);
    expect(sinTurno).toEqual({ desde: 1200, hasta: 1320 });
  });

  it('si el tipo lo permite, el rato final se ofrece como turno corto', () => {
    const { turnos, sinTurno } = generarTurnos(
      dia('08:00', '22:00'),
      180,
      true,
    );

    expect(turnos.at(-1)).toEqual({ desde: 1200, hasta: 1320, corto: true });
    expect(turnos.filter((turno) => turno.corto)).toHaveLength(1);
    expect(sinTurno).toBeUndefined();
  });

  it('un rato de menos de 30 minutos nunca se ofrece', () => {
    const { turnos, sinTurno } = generarTurnos(dia('08:00', '10:20'), 60, true);

    expect(textos(turnos)).toEqual(['08-09', '09-10']);
    expect(sinTurno).toEqual({ desde: 600, hasta: 620 });
  });

  it('respeta los minutos de la apertura', () => {
    const { turnos } = generarTurnos(dia('08:30', '10:30'), 60, false);

    expect(turnos.map((turno) => turno.desde)).toEqual([510, 570]);
  });

  it('si el día es más corto que un turno, no hay turnos completos', () => {
    const { turnos, sinTurno } = generarTurnos(
      dia('08:00', '09:00'),
      120,
      false,
    );

    expect(turnos).toEqual([]);
    expect(sinTurno).toEqual({ desde: 480, hasta: 540 });
  });
});
