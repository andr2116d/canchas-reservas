import {
  aHora,
  aMinutos,
  DURACION_TURNO_MIN,
  diaSemanaDe,
  generarTurnos,
  type Turno,
} from './generar-turnos';

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

  it('un día cerrado genera una lista vacía', () => {
    expect(
      generarTurnos({ abierto: false, apertura: null, cierre: null }, '18:00'),
    ).toEqual([]);
    expect(
      generarTurnos(
        { abierto: false, apertura: '08:00', cierre: '23:00' },
        '18:00',
      ),
    ).toEqual([]);
  });

  it('acepta 08:15 y genera turnos desde 08:15', () => {
    const lista = generarTurnos(abierto('08:15', '12:00'), '18:00');
    expect(lista[0]).toEqual({
      horaInicio: '08:15',
      horaFin: '09:15',
      franja: 'DIA',
    });
    expect(lista).toHaveLength(3);
  });

  it.each([
    ['08:00', '23:00', '18:00'],
    ['08:15', '23:15', '18:00'],
    ['06:40', '23:59', '18:40'],
    ['10:00', '22:00', '17:20'],
    ['00:00', '23:59', '12:30'],
  ])(
    'de %s a %s con noche a las %s ningún turno cruza el inicio de noche',
    (apertura, cierre, inicioNoche) => {
      const lista = generarTurnos(abierto(apertura, cierre), inicioNoche);
      expect(lista.length).toBeGreaterThan(0);
      for (const turno of lista) {
        expect(turno.horaInicio >= apertura).toBe(true);
        expect(turno.horaFin <= cierre).toBe(true);
        if (turno.franja === 'DIA') {
          expect(turno.horaFin <= inicioNoche).toBe(true);
        } else {
          expect(turno.horaInicio >= inicioNoche).toBe(true);
        }
      }
    },
  );

  it('si la noche empieza después del cierre todos los turnos son de día', () => {
    const lista = generarTurnos(abierto('08:00', '12:00'), '18:00');
    expect(lista.map((t) => t.franja)).toEqual(['DIA', 'DIA', 'DIA', 'DIA']);
  });

  it('si queda menos de 1 hora no genera turnos', () => {
    expect(generarTurnos(abierto('17:30', '18:20'), '18:00')).toEqual([]);
  });

  describe('bordes', () => {
    it('con la noche igual a la apertura todos los turnos son de noche', () => {
      expect(generarTurnos(abierto('18:00', '21:00'), '18:00')).toEqual(
        turnos(
          'NOCHE',
          ['18:00', '19:00'],
          ['19:00', '20:00'],
          ['20:00', '21:00'],
        ),
      );
    });

    it('con la noche igual al cierre todos los turnos son de día', () => {
      expect(generarTurnos(abierto('15:00', '18:00'), '18:00')).toEqual(
        turnos(
          'DIA',
          ['15:00', '16:00'],
          ['16:00', '17:00'],
          ['17:00', '18:00'],
        ),
      );
    });

    it('con apertura a las 00:00 el primer turno es de 00:00 a 01:00', () => {
      expect(generarTurnos(abierto('00:00', '03:00'), '18:00')).toEqual(
        turnos(
          'DIA',
          ['00:00', '01:00'],
          ['01:00', '02:00'],
          ['02:00', '03:00'],
        ),
      );
    });

    it('con cierre a las 23:59 el último turno es de 22:00 a 23:00 y se pierde 23:00-23:59', () => {
      expect(generarTurnos(abierto('20:00', '23:59'), '18:00')).toEqual(
        turnos(
          'NOCHE',
          ['20:00', '21:00'],
          ['21:00', '22:00'],
          ['22:00', '23:00'],
        ),
      );
    });

    it('un tramo de exactamente 1 hora genera un turno', () => {
      expect(generarTurnos(abierto('17:00', '18:00'), '18:00')).toEqual(
        turnos('DIA', ['17:00', '18:00']),
      );
    });

    it('un tramo de 59 minutos no genera turnos', () => {
      expect(generarTurnos(abierto('08:00', '08:59'), '18:00')).toEqual([]);
      expect(generarTurnos(abierto('18:00', '18:59'), '18:00')).toEqual([]);
    });
  });
});

describe('generarTurnos en un barrido de horarios', () => {
  const horasCada = (pasoMin: number) =>
    Array.from({ length: (24 * 60) / pasoMin }, (_, i) => aHora(i * pasoMin));
  const HORAS = horasCada(15);
  const INICIOS_NOCHE = horasCada(30);

  interface Caso {
    apertura: number;
    cierre: number;
    noche: number;
    turnos: { inicio: number; fin: number; franja: Turno['franja'] }[];
  }

  const CASOS: Caso[] = [];
  for (const apertura of HORAS) {
    for (const cierre of HORAS) {
      if (cierre <= apertura) continue;
      for (const noche of INICIOS_NOCHE) {
        CASOS.push({
          apertura: aMinutos(apertura),
          cierre: aMinutos(cierre),
          noche: aMinutos(noche),
          turnos: generarTurnos(abierto(apertura, cierre), noche).map((t) => ({
            inicio: aMinutos(t.horaInicio),
            fin: aMinutos(t.horaFin),
            franja: t.franja,
          })),
        });
      }
    }
  }

  const fallosDe = (cumple: (caso: Caso) => boolean) =>
    CASOS.filter((caso) => !cumple(caso))
      .slice(0, 5)
      .map(
        ({ apertura, cierre, noche }) =>
          `${aHora(apertura)}-${aHora(cierre)} noche ${aHora(noche)}`,
      );

  it('recorre apertura y cierre cada 15 minutos y la noche cada 30', () => {
    expect(CASOS).toHaveLength(((96 * 95) / 2) * 48);
  });

  it('todos los turnos duran 60 minutos', () => {
    expect(
      fallosDe(({ turnos }) =>
        turnos.every((t) => t.fin - t.inicio === DURACION_TURNO_MIN),
      ),
    ).toEqual([]);
  });

  it('los turnos están ordenados y no se solapan', () => {
    expect(
      fallosDe(({ turnos }) =>
        turnos.every((t, i) => i === 0 || t.inicio >= turnos[i - 1].fin),
      ),
    ).toEqual([]);
  });

  it('los turnos quedan dentro de la apertura y el cierre', () => {
    expect(
      fallosDe(({ apertura, cierre, turnos }) =>
        turnos.every((t) => t.inicio >= apertura && t.fin <= cierre),
      ),
    ).toEqual([]);
  });
});

describe('diaSemanaDe', () => {
  it.each([
    ['2026-10-19', 1],
    ['2026-10-20', 2],
    ['2026-10-21', 3],
    ['2026-10-23', 5],
    ['2026-10-24', 6],
    ['2026-10-25', 7],
    ['2026-12-31', 4],
    ['2027-01-03', 7],
  ])('%s es el día %i', (fecha, dia) => {
    expect(diaSemanaDe(fecha)).toBe(dia);
  });
});
