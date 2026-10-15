import { generarTurnos, type Turno } from './generar-turnos';

const abierto = (apertura: string, cierre: string) => ({
  abierto: true,
  apertura,
  cierre,
});

const turnos = (
  franja: Turno['franja'],
  ...inicios: [string, string][]
): Turno[] =>
  inicios.map(([horaInicio, horaFin]) => ({ horaInicio, horaFin, franja }));

const NOCHE_08_00_A_23_00 = turnos(
  'NOCHE',
  ['18:00', '19:00'],
  ['19:00', '20:00'],
  ['20:00', '21:00'],
  ['21:00', '22:00'],
  ['22:00', '23:00'],
);

describe('generarTurnos', () => {
  describe('tabla de ejemplos con noche a las 18:00', () => {
    it('08:00 - 23:00 genera 10 de día y 5 de noche', () => {
      expect(generarTurnos(abierto('08:00', '23:00'), '18:00')).toEqual([
        ...turnos(
          'DIA',
          ['08:00', '09:00'],
          ['09:00', '10:00'],
          ['10:00', '11:00'],
          ['11:00', '12:00'],
          ['12:00', '13:00'],
          ['13:00', '14:00'],
          ['14:00', '15:00'],
          ['15:00', '16:00'],
          ['16:00', '17:00'],
          ['17:00', '18:00'],
        ),
        ...NOCHE_08_00_A_23_00,
      ]);
    });

    it('08:30 - 23:00 genera 9 de día hasta 17:30 y 5 de noche', () => {
      expect(generarTurnos(abierto('08:30', '23:00'), '18:00')).toEqual([
        ...turnos(
          'DIA',
          ['08:30', '09:30'],
          ['09:30', '10:30'],
          ['10:30', '11:30'],
          ['11:30', '12:30'],
          ['12:30', '13:30'],
          ['13:30', '14:30'],
          ['14:30', '15:30'],
          ['15:30', '16:30'],
          ['16:30', '17:30'],
        ),
        ...NOCHE_08_00_A_23_00,
      ]);
    });

    it('08:15 - 23:15 genera 9 de día hasta 17:15 y 5 de noche hasta 23:00', () => {
      expect(generarTurnos(abierto('08:15', '23:15'), '18:00')).toEqual([
        ...turnos(
          'DIA',
          ['08:15', '09:15'],
          ['09:15', '10:15'],
          ['10:15', '11:15'],
          ['11:15', '12:15'],
          ['12:15', '13:15'],
          ['13:15', '14:15'],
          ['14:15', '15:15'],
          ['15:15', '16:15'],
          ['16:15', '17:15'],
        ),
        ...NOCHE_08_00_A_23_00,
      ]);
    });

    it('19:00 - 23:00 genera 0 de día y 4 de noche', () => {
      expect(generarTurnos(abierto('19:00', '23:00'), '18:00')).toEqual(
        turnos(
          'NOCHE',
          ['19:00', '20:00'],
          ['20:00', '21:00'],
          ['21:00', '22:00'],
          ['22:00', '23:00'],
        ),
      );
    });
  });
});
