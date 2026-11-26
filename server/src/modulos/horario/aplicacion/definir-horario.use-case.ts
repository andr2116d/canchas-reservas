import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { HorarioRepository } from '../dominio/horario.repository';
import { construirHorario, type DatosDelHorario } from './construir-horario';
import { aVista, type VistaDeHorario } from './vista-de-horario';

export type { DatosDelHorario };

/**
 * Define el horario de atención de la semana. Rige desde que se guarda;
 * guardar el mismo horario no es un cambio.
 */
export class DefinirHorarioUseCase {
  constructor(
    private readonly horarios: Pick<HorarioRepository, 'guardarSiCambia'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDelHorario,
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDeHorario }> {
    const { cambio, version } = await this.horarios.guardarSiCambia(
      construirHorario(datos),
      administradorId,
      this.reloj.ahora(),
    );
    return { cambio, vigente: aVista(version) };
  }
}
