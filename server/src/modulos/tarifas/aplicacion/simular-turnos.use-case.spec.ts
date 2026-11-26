import type { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { DIAS_DE_LA_SEMANA } from '../../horario/api-horario';
import {
  type DatosDeSimulacion,
  SimularTurnosUseCase,
} from './simular-turnos.use-case';

const FUTBOL_7 = {
  tipo: 'FUTBOL_7',
  precioDia: '50',
  precioNoche: '100',
  duracionDelTurno: '3',
  ofreceTurnoCorto: false,
};

function unaSimulacion(
  cambios: Partial<DatosDeSimulacion> = {},
): DatosDeSimulacion {
  return {
    horario: {
      inicioDeLaNoche: '18:00',
      dias: DIAS_DE_LA_SEMANA.map((dia) => {
        if (dia === 'DOMINGO') return { dia, abierto: false };
        const noche = dia === 'SABADO' ? { inicioDeLaNoche: '17:00' } : {};
        return { dia, abierto: true, abre: '08:00', cierra: '22:00', ...noche };
      }),
    },
    tarifas: [FUTBOL_7],
    ...cambios,
  };
}

async function errores(promesa: Promise<unknown>) {
  return promesa.then(
    () => {
      throw new Error('Se esperaba un error');
    },
    (error: ReglaInvalidaError) => error.errores,
  );
}

describe('Simular turnos', () => {
  const simular = new SimularTurnosUseCase();

  it('calcula cada día de la semana con el horario y la tarifa en edición, sin guardar nada', async () => {
    const { tipos } = await simular.ejecutar(unaSimulacion());
    const futbol7 = tipos.FUTBOL_7;

    expect(futbol7?.DOMINGO).toEqual({ estado: 'CERRADO' });
    const lunes = futbol7?.LUNES;
    if (lunes?.estado !== 'ABIERTO')
      throw new Error('Se esperaba un día abierto');
    expect(lunes.turnos.map((turno) => turno.total)).toEqual([
      '50.00',
      '50.00',
      '50.00',
      '83.33',
    ]);
    expect(lunes.sinTurno).toEqual({ desde: '20:00', hasta: '22:00' });
    expect(futbol7?.SABADO).toMatchObject({ inicioDeLaNoche: '17:00' });
  });

  it('ofrece el turno corto si la tarifa en edición lo permite', async () => {
    const { tipos } = await simular.ejecutar(
      unaSimulacion({ tarifas: [{ ...FUTBOL_7, ofreceTurnoCorto: true }] }),
    );

    const lunes = tipos.FUTBOL_7?.LUNES;
    if (lunes?.estado !== 'ABIERTO')
      throw new Error('Se esperaba un día abierto');
    expect(lunes.turnos.at(-1)).toMatchObject({
      desde: '20:00',
      hasta: '22:00',
      corto: true,
      total: '66.67',
    });
  });

  it('solo calcula los tipos que llegan', async () => {
    const { tipos } = await simular.ejecutar(unaSimulacion());

    expect(Object.keys(tipos)).toEqual(['FUTBOL_7']);
  });

  it('dice qué dato no sirve, del horario o de la tarifa de cada tipo', async () => {
    const semana = unaSimulacion().horario;
    const malo = {
      horario: {
        ...semana,
        dias: semana.dias.map((dia) =>
          dia.dia === 'MARTES' ? { ...dia, cierra: '07:00' } : dia,
        ),
      },
      tarifas: [{ ...FUTBOL_7, tipo: 'FUTBOL_5', precioDia: '0' }],
    };

    expect(await errores(simular.ejecutar(malo))).toEqual({
      'horario.MARTES.cierra': 'El cierre debe ser después de la apertura.',
      'FUTBOL_5.precioDia': 'El monto debe ser mayor que cero.',
    });
  });
});
