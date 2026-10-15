import { HorarioService } from '../horario/horario.service';
import { TurnosService } from './turnos.service';

describe('TurnosService', () => {
  const horario = { diaDe: jest.fn() };
  const servicio = new TurnosService(horario as unknown as HorarioService);

  beforeEach(() => jest.resetAllMocks());

  it('genera los turnos del día de esa fecha alineados con la noche', async () => {
    horario.diaDe.mockResolvedValue({
      dia: { diaSemana: 2, abierto: true, apertura: '15:30', cierre: '20:00' },
      inicioNoche: '18:00',
    });

    const turnos = await servicio.generar('2026-10-20');

    expect(horario.diaDe).toHaveBeenCalledWith('2026-10-20');
    expect(turnos).toEqual([
      { horaInicio: '15:30', horaFin: '16:30', franja: 'DIA' },
      { horaInicio: '16:30', horaFin: '17:30', franja: 'DIA' },
      { horaInicio: '18:00', horaFin: '19:00', franja: 'NOCHE' },
      { horaInicio: '19:00', horaFin: '20:00', franja: 'NOCHE' },
    ]);
  });

  it('un día cerrado no genera turnos', async () => {
    horario.diaDe.mockResolvedValue({
      dia: { diaSemana: 7, abierto: false, apertura: null, cierre: null },
      inicioNoche: '18:00',
    });

    await expect(servicio.generar('2026-10-25')).resolves.toEqual([]);
  });
});
