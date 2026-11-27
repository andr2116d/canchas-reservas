import {
  enLima,
  estadoEn,
  MANANA,
  prepararElLocal as preparar,
} from '../../../../test/disponibilidad/fabricas/local-de-prueba';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';

describe('El mapa de turnos a lo largo del tiempo', () => {
  it('dice cuándo cambia algo solo por la hora: el próximo inicio de turno o fin de bloqueo', async () => {
    const { consultar, ocupacion } = preparar();
    ocupacion.bloqueos.push({
      canchaId: 1,
      inicio: enLima('2026-11-24', '15:00'),
      fin: enLima('2026-11-24', '15:45'),
    });

    const hoy = await consultar.ejecutar('2026-11-24');

    expect(hoy.proximoCambio).toEqual(enLima('2026-11-24', '15:45'));
  });

  it('una reserva pendiente de pago que ya venció deja su turno libre', async () => {
    const { consultar, ocupacion } = preparar();
    ocupacion.reservas.push({
      canchaId: 1,
      inicio: enLima(MANANA, '18:00'),
      fin: enLima(MANANA, '19:00'),
      estado: 'PENDIENTE_DE_PAGO',
      venceEn: enLima('2026-11-24', '15:20'),
    });

    const mapa = await consultar.ejecutar(MANANA);

    expect(estadoEn(mapa, '18:00', 1)).toBe('DISPONIBLE');
  });

  it('avisa cuándo vence una reserva pendiente de pago, porque su turno vuelve a quedar libre', async () => {
    const { consultar, ocupacion } = preparar();
    ocupacion.reservas.push({
      canchaId: 1,
      inicio: enLima('2026-11-24', '18:00'),
      fin: enLima('2026-11-24', '19:00'),
      estado: 'PENDIENTE_DE_PAGO',
      venceEn: enLima('2026-11-24', '15:35'),
    });

    const hoy = await consultar.ejecutar('2026-11-24');

    expect(estadoEn(hoy, '18:00', 1)).toBe('PENDIENTE');
    expect(hoy.proximoCambio).toEqual(enLima('2026-11-24', '15:35'));
  });
});

describe('Fechas que se pueden consultar', () => {
  it('sin fecha consulta hoy y dice hasta qué día se puede consultar', async () => {
    const { consultar } = preparar();

    const mapa = await consultar.ejecutar(undefined);

    expect(mapa).toMatchObject({
      fecha: '2026-11-24',
      hoy: '2026-11-24',
      ultimaFecha: '2026-12-24',
      ahora: enLima('2026-11-24', '15:20'),
    });
  });

  it('acepta hasta 30 días hacia adelante', async () => {
    const { consultar } = preparar();

    await expect(consultar.ejecutar('2026-12-24')).resolves.toBeDefined();
  });

  it.each([
    ['2026-11-23', 'Elige una fecha desde hoy.'],
    ['2026-12-25', 'Solo se pueden consultar los próximos 30 días.'],
    ['2026-02-30', 'Ingresa una fecha válida.'],
    ['mañana', 'Ingresa una fecha válida.'],
  ])('rechaza %s', async (fecha, mensaje) => {
    const { consultar } = preparar();

    const rechazo = consultar.ejecutar(fecha);

    await expect(rechazo).rejects.toThrow(ReglaInvalidaError);
    await expect(rechazo).rejects.toMatchObject({
      errores: { fecha: mensaje },
    });
  });
});
