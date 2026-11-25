import { EnMemoriaAdelantoRepository } from '../../../../test/adelanto/dobles/en-memoria-adelanto.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { OcupacionDePrueba } from '../../../../test/disponibilidad/dobles/ocupacion-de-prueba';
import { EnMemoriaHorarioRepository } from '../../../../test/horario/dobles/en-memoria-horario.repository';
import { EnMemoriaTarifaRepository } from '../../../../test/tarifas/dobles/en-memoria-tarifa.repository';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { PorcentajeDeAdelanto } from '../../adelanto/api-adelanto';
import { construirHorario } from '../../horario/api-horario';
import { construirTarifa } from '../../tarifas/api-tarifas';
import {
  ConsultarDisponibilidadUseCase,
  type MapaDelDia,
} from './consultar-disponibilidad.use-case';

const MANANA = '2026-11-25';
const GUARDADO = { guardadoEn: new Date(0), guardadoPor: 'Valeria León' };
const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];
const enLima = (fecha: string, hora: string) =>
  new Date(`${fecha}T${hora}:00-05:00`);

/** El local abre de 16:00 a 22:00 y la noche empieza a las 18:00; fútbol 5 tiene tarifa, fútbol 7 no. */
function preparar({ ahora = enLima('2026-11-24', '15:20') } = {}) {
  const tarifas = new EnMemoriaTarifaRepository();
  const horarios = new EnMemoriaHorarioRepository();
  const adelantos = new EnMemoriaAdelantoRepository();
  const ocupacion = new OcupacionDePrueba();
  horarios.versiones.push({
    ...GUARDADO,
    horario: construirHorario({
      inicioDeLaNoche: '18:00',
      dias: DIAS.map((dia) => ({
        dia,
        abierto: true,
        abre: '16:00',
        cierra: '22:00',
      })),
    }),
  });
  tarifas.versiones.push({
    guardadaEn: new Date(0),
    guardadaPor: 'Valeria León',
    tarifa: construirTarifa('FUTBOL_5', {
      precioDia: '60',
      precioNoche: '80',
      duracionDelTurno: '1',
      ofreceTurnoCorto: false,
    }),
  });
  adelantos.versiones.push({
    guardadoEn: new Date(0),
    guardadoPor: 'Valeria León',
    porcentaje: PorcentajeDeAdelanto.crear('50'),
  });
  ocupacion.canchas.push(
    { id: 1, nombre: 'Cancha 1', tipo: 'FUTBOL_5', tieneIluminacion: true },
    { id: 2, nombre: 'Cancha 2', tipo: 'FUTBOL_5', tieneIluminacion: false },
    { id: 3, nombre: 'Cancha 3', tipo: 'FUTBOL_7', tieneIluminacion: true },
  );
  const consultar = new ConsultarDisponibilidadUseCase({
    tarifas,
    horarios,
    adelantos,
    ocupacion,
    reloj: new RelojDePrueba(ahora),
  });
  return { consultar, ocupacion, adelantos, horarios };
}

function futbol5(mapa: MapaDelDia) {
  const tipo = mapa.tipos.find((t) => t.tipo === 'FUTBOL_5');
  if (tipo?.estado !== 'CON_TURNOS') throw new Error('Sin turnos de fútbol 5');
  return tipo;
}

const estadoEn = (mapa: MapaDelDia, desde: string, canchaId: number) =>
  futbol5(mapa)
    .turnos.find((t) => t.desde === desde)
    ?.canchas.find((c) => c.canchaId === canchaId)?.estado;

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
});

describe('Fechas que se pueden consultar', () => {
  it('sin fecha consulta hoy y dice hasta qué día se puede consultar', async () => {
    const { consultar } = preparar();

    const mapa = await consultar.ejecutar(undefined);

    expect(mapa).toMatchObject({
      fecha: '2026-11-24',
      hoy: '2026-11-24',
      ultimaFecha: '2026-12-24',
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
