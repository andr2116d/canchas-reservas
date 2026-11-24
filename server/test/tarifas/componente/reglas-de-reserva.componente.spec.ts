import { crearComponenteDePrueba } from '../../compartido/soporte/crear-componente-de-prueba';

const TARIFA = {
  precioDia: '50',
  precioNoche: '100',
  duracionDelTurno: '3',
  ofreceTurnoCorto: false,
};
const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];
const HORARIO = {
  inicioDeLaNoche: '18:00',
  dias: DIAS.map((dia) => ({
    dia,
    abierto: true,
    abre: '08:00',
    cierra: '22:00',
  })),
};
const REGLA = {
  rangos: [
    { desdeHoras: '24', porcentaje: '100', ofreceCredito: true },
    { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
  ],
};

describe('Componente de las reglas de reserva', () => {
  let componente: Awaited<ReturnType<typeof crearComponenteDePrueba>>;
  let administrador: string;

  beforeEach(async () => {
    componente = await crearComponenteDePrueba();
    administrador = componente.como('ADMINISTRADOR');
  });
  afterEach(() => componente.app.close());

  const api = () => componente.api();

  it.each([
    ['put', '/api/tarifas/FUTBOL_7', TARIFA],
    ['put', '/api/horario', HORARIO],
    ['put', '/api/cancelacion/regla', REGLA],
  ] as const)(
    'solo administración guarda en %s %s',
    async (metodo, ruta, cuerpo) => {
      await api()[metodo](ruta).send(cuerpo).expect(401);
      await api()
        [metodo](ruta)
        .set('Cookie', componente.como('RECEPCIONISTA'))
        .send(cuerpo)
        .expect(403);
      await api()
        [metodo](ruta)
        .set('Cookie', componente.como('JUGADOR'))
        .send(cuerpo)
        .expect(403);
    },
  );

  describe('tarifas', () => {
    it.each([
      [
        'un tipo de cancha que no existe',
        '/api/tarifas/FUTBOL_11',
        TARIFA,
        404,
      ],
      [
        'un precio de cero',
        '/api/tarifas/FUTBOL_7',
        { ...TARIFA, precioDia: '0' },
        400,
      ],
      [
        'un precio con tres decimales',
        '/api/tarifas/FUTBOL_7',
        { ...TARIFA, precioNoche: '10.555' },
        400,
      ],
      [
        'un turno de 13 horas',
        '/api/tarifas/FUTBOL_7',
        { ...TARIFA, duracionDelTurno: '13' },
        400,
      ],
      [
        'un turno de media hora',
        '/api/tarifas/FUTBOL_7',
        { ...TARIFA, duracionDelTurno: '0.5' },
        400,
      ],
      [
        'el turno corto como texto',
        '/api/tarifas/FUTBOL_7',
        { ...TARIFA, ofreceTurnoCorto: 'si' },
        400,
      ],
    ])('rechaza %s', async (_caso, ruta, cuerpo, estado) => {
      await api()
        .put(ruta)
        .set('Cookie', administrador)
        .send(cuerpo)
        .expect(estado);
    });

    it('guardar los mismos valores no crea otra versión', async () => {
      const guardar = () =>
        api()
          .put('/api/tarifas/FUTBOL_7')
          .set('Cookie', administrador)
          .send(TARIFA)
          .expect(200);

      await guardar();
      await guardar();

      expect(componente.dobles.tarifas.versiones).toHaveLength(1);
    });

    it('la simulación rechaza un horario imposible sin guardar nada', async () => {
      const respuesta = await api()
        .post('/api/tarifas/simulacion')
        .set('Cookie', administrador)
        .send({
          horario: {
            ...HORARIO,
            dias: [
              { dia: 'LUNES', abierto: true, abre: '22:00', cierra: '08:00' },
            ],
          },
          tarifas: [{ ...TARIFA, tipo: 'FUTBOL_7' }],
        });

      expect(respuesta.status).toBe(400);
    });
  });

  describe('horario', () => {
    it.each([
      [
        'un día repetido',
        { ...HORARIO, dias: [...HORARIO.dias, HORARIO.dias[0]] },
      ],
      [
        'un cierre antes de la apertura',
        {
          ...HORARIO,
          dias: [
            { dia: 'LUNES', abierto: true, abre: '22:00', cierra: '08:00' },
          ],
        },
      ],
      ['una hora inventada', { ...HORARIO, inicioDeLaNoche: '25:00' }],
      [
        'un cierre después de medianoche',
        {
          ...HORARIO,
          dias: [
            { dia: 'LUNES', abierto: true, abre: '08:00', cierra: '24:30' },
          ],
        },
      ],
    ])('rechaza %s', async (_caso, cuerpo) => {
      await api()
        .put('/api/horario')
        .set('Cookie', administrador)
        .send(cuerpo)
        .expect(400);
    });
  });

  describe('regla de cancelación', () => {
    it.each([
      [
        'sin rango desde 0 horas',
        {
          rangos: [
            { desdeHoras: '24', porcentaje: '100', ofreceCredito: false },
          ],
        },
      ],
      [
        'un porcentaje de 101',
        {
          rangos: [
            { desdeHoras: '0', porcentaje: '101', ofreceCredito: false },
          ],
        },
      ],
      [
        'negar la devolución en todos los casos',
        {
          rangos: [
            { desdeHoras: '24', porcentaje: '0', ofreceCredito: false },
            { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
          ],
        },
      ],
      [
        'devolver más con menos anticipación',
        {
          rangos: [
            { desdeHoras: '24', porcentaje: '50', ofreceCredito: false },
            { desdeHoras: '0', porcentaje: '80', ofreceCredito: false },
          ],
        },
      ],
      [
        'dos rangos desde la misma hora',
        {
          rangos: [
            { desdeHoras: '0', porcentaje: '50', ofreceCredito: false },
            { desdeHoras: '0', porcentaje: '20', ofreceCredito: false },
          ],
        },
      ],
      [
        'más de 720 horas',
        {
          rangos: [
            { desdeHoras: '721', porcentaje: '100', ofreceCredito: false },
            { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
          ],
        },
      ],
    ])('rechaza %s', async (_caso, cuerpo) => {
      await api()
        .put('/api/cancelacion/regla')
        .set('Cookie', administrador)
        .send(cuerpo)
        .expect(400);
    });

    it('la simulación rechaza una anticipación con decimales', async () => {
      await api()
        .post('/api/cancelacion/simulacion')
        .set('Cookie', administrador)
        .send({
          ...REGLA,
          anticipo: '50',
          pagado: '100',
          minutosDeAnticipacion: 1.5,
        })
        .expect(400);
    });
  });
});
