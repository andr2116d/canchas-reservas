import {
  enLima,
  estadoEn,
  futbol5,
  MANANA,
  prepararElLocal as preparar,
} from '../../../../test/disponibilidad/fabricas/local-de-prueba';
describe('Consultar la disponibilidad de un día', () => {
  it('muestra cada cancha activa con los turnos del día, su precio y el adelanto mínimo', async () => {
    const { consultar } = preparar();

    const mapa = await consultar.ejecutar(MANANA);

    const tipo = futbol5(mapa);
    expect(tipo.canchas.map((c) => c.nombre)).toEqual(['Cancha 1', 'Cancha 2']);
    expect(tipo.turnos.map((t) => t.desde)).toEqual([
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
    ]);
    expect(tipo.turnos[0]).toMatchObject({
      hasta: '17:00',
      franja: 'DIA',
      precio: '60.00',
      adelanto: '30.00',
    });
    expect(tipo.turnos[2]).toMatchObject({
      franja: 'NOCHE',
      precio: '80.00',
      adelanto: '40.00',
    });
    expect(estadoEn(mapa, '16:00', 1)).toBe('DISPONIBLE');
  });

  it('una cancha sin luz no ofrece los turnos que llegan a la noche', async () => {
    const { consultar } = preparar();

    const mapa = await consultar.ejecutar(MANANA);

    expect(estadoEn(mapa, '17:00', 2)).toBe('DISPONIBLE');
    expect(estadoEn(mapa, '18:00', 2)).toBe('SIN_LUZ');
  });

  it('una reserva pendiente de pago o de validación se ve pendiente; confirmada o en juego, ocupada', async () => {
    const { consultar, ocupacion } = preparar();
    const reserva = (hora: string, estado: string) => ({
      canchaId: 1,
      inicio: enLima(MANANA, hora),
      fin: enLima(MANANA, `${Number(hora.slice(0, 2)) + 1}:00`),
      estado: estado as never,
      venceEn: null,
    });
    ocupacion.reservas.push(
      reserva('16:00', 'PENDIENTE_DE_PAGO'),
      reserva('17:00', 'PENDIENTE_DE_VALIDACION'),
      reserva('18:00', 'CONFIRMADA'),
      reserva('19:00', 'EN_JUEGO'),
    );

    const mapa = await consultar.ejecutar(MANANA);

    expect(
      ['16:00', '17:00', '18:00', '19:00', '20:00'].map((hora) =>
        estadoEn(mapa, hora, 1),
      ),
    ).toEqual(['PENDIENTE', 'PENDIENTE', 'OCUPADO', 'OCUPADO', 'DISPONIBLE']);
  });

  it('un turno que toca un bloqueo, aunque sea en parte, está en mantenimiento', async () => {
    const { consultar, ocupacion } = preparar();
    ocupacion.bloqueos.push({
      canchaId: 1,
      inicio: enLima(MANANA, '16:30'),
      fin: enLima(MANANA, '17:10'),
    });

    const mapa = await consultar.ejecutar(MANANA);

    expect(estadoEn(mapa, '16:00', 1)).toBe('MANTENIMIENTO');
    expect(estadoEn(mapa, '17:00', 1)).toBe('MANTENIMIENTO');
    expect(estadoEn(mapa, '18:00', 1)).toBe('DISPONIBLE');
    expect(estadoEn(mapa, '16:00', 2)).toBe('DISPONIBLE');
  });

  it('hoy, un turno libre que ya empezó no se puede elegir; uno ocupado sigue ocupado', async () => {
    const { consultar, ocupacion } = preparar({
      ahora: enLima('2026-11-24', '17:00'),
    });
    ocupacion.reservas.push({
      canchaId: 2,
      inicio: enLima('2026-11-24', '16:00'),
      fin: enLima('2026-11-24', '17:00'),
      estado: 'CONFIRMADA',
      venceEn: null,
    });

    const mapa = await consultar.ejecutar('2026-11-24');

    expect(estadoEn(mapa, '16:00', 1)).toBe('YA_EMPEZO');
    expect(estadoEn(mapa, '17:00', 1)).toBe('YA_EMPEZO');
    expect(estadoEn(mapa, '16:00', 2)).toBe('OCUPADO');
    expect(estadoEn(mapa, '18:00', 1)).toBe('DISPONIBLE');
  });

  it('un tipo sin tarifa muestra sus canchas sin turnos y dice que no tiene precio', async () => {
    const { consultar } = preparar();

    const mapa = await consultar.ejecutar(MANANA);

    expect(mapa.tipos.find((t) => t.tipo === 'FUTBOL_7')).toEqual({
      tipo: 'FUTBOL_7',
      estado: 'SIN_TARIFA',
      canchas: [{ id: 3, nombre: 'Cancha 3', tieneIluminacion: true }],
    });
  });

  it('no incluye los tipos que no tienen canchas activas', async () => {
    const { consultar, ocupacion } = preparar();
    ocupacion.canchas.splice(2, 1);

    const mapa = await consultar.ejecutar(MANANA);

    expect(mapa.tipos.map((t) => t.tipo)).toEqual(['FUTBOL_5']);
  });

  it('sin adelanto guardado muestra el precio y deja el adelanto sin definir', async () => {
    const { consultar, adelantos } = preparar();
    adelantos.versiones.splice(0);

    const mapa = await consultar.ejecutar(MANANA);

    expect(mapa.adelanto).toBeNull();
    expect(futbol5(mapa).turnos[0]).toMatchObject({
      precio: '60.00',
      adelanto: null,
    });
  });

  it('sin horario guardado no hay turnos y lo dice', async () => {
    const { consultar, horarios } = preparar();
    horarios.versiones.splice(0);

    const mapa = await consultar.ejecutar(MANANA);

    expect(mapa).toMatchObject({ local: 'SIN_HORARIO', tipos: [] });
  });
});
