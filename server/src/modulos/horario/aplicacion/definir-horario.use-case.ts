import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  fechaEnLima,
  horaEnLima,
  momentoEnLima,
} from '../../../compartido/dominio/momento-en-lima';
import type { HorarioSemanal } from '../dominio/horario-semanal';
import type { HorarioRepository } from '../dominio/horario.repository';
import {
  type ReservaFueraDeHorario,
  ReservasFueraDeHorarioError,
} from '../dominio/reservas-fuera-de-horario.error';
import { construirHorario, type DatosDelHorario } from './construir-horario';
import type {
  ReservaPorJugar,
  ReservasPorJugar,
} from './reservas-por-jugar.port';
import { aVista, type VistaDeHorario } from './vista-de-horario';

export type { DatosDelHorario };

const MS_POR_MINUTO = 60 * 1000;

/** Una reserva en la fecha y las horas de Lima; un turno que termina a medianoche llega a 24:00. */
function enLima({ inicio, fin, titular, ...reserva }: ReservaPorJugar) {
  const fecha = fechaEnLima(inicio);
  const medianoche = momentoEnLima(fecha, '00:00').getTime();
  const minutos = (momento: Date) =>
    (momento.getTime() - medianoche) / MS_POR_MINUTO;
  const vista: ReservaFueraDeHorario = {
    ...reserva,
    fecha,
    desde: horaEnLima(inicio),
    hasta: minutos(fin) === 1440 ? '24:00' : horaEnLima(fin),
    titular: titular.nombre,
    celular: titular.celular,
  };
  return { vista, desde: minutos(inicio), hasta: minutos(fin) };
}

/**
 * Define el horario de atención de la semana. Rige desde que se guarda; guardar el mismo
 * horario no es un cambio. Si deja reservas por jugar fuera, pide confirmar: no se anulan.
 */
export class DefinirHorarioUseCase {
  constructor(
    private readonly horarios: Pick<
      HorarioRepository,
      'vigente' | 'guardarSiCambia'
    >,
    private readonly reservas: ReservasPorJugar,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDelHorario & { confirmar?: boolean },
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDeHorario }> {
    const horario = construirHorario(datos);
    const ahora = this.reloj.ahora();
    const fuera = await this.fueraDelHorario(horario, ahora);
    if (fuera.length > 0 && datos.confirmar !== true)
      throw new ReservasFueraDeHorarioError(fuera);
    const { cambio, version } = await this.horarios.guardarSiCambia(
      horario,
      administradorId,
      ahora,
      fuera.map((reserva) => reserva.codigo),
    );
    return { cambio, vigente: aVista(version) };
  }

  /** Las reservas por jugar que el horario nuevo ya no atiende; ninguna si el horario no cambia. */
  private async fueraDelHorario(
    horario: HorarioSemanal,
    ahora: Date,
  ): Promise<ReservaFueraDeHorario[]> {
    const actual = await this.horarios.vigente();
    if (actual?.horario.igualA(horario)) return [];
    return (await this.reservas.desde(ahora))
      .map(enLima)
      .filter(
        ({ vista, desde, hasta }) =>
          !horario.atiende(vista.fecha, desde, hasta),
      )
      .map(({ vista }) => vista);
  }
}
