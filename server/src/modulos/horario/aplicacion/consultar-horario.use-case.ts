import type { HorarioRepository } from '../dominio/horario.repository';
import { INICIO_DE_LA_NOCHE_POR_DEFECTO } from '../dominio/horario-semanal';
import { aVista, type VistaDeHorario } from './vista-de-horario';

export interface HorarioConsultado {
  /** Falta si todavía no se guardó ningún horario. */
  vigente?: VistaDeHorario;
  historial: VistaDeHorario[];
  inicioDeLaNochePorDefecto: string;
}

/** Horario vigente, sus versiones anteriores y la hora de noche que se propone al empezar. */
export class ConsultarHorarioUseCase {
  constructor(
    private readonly horarios: Pick<HorarioRepository, 'historial'>,
  ) {}

  async ejecutar(): Promise<HorarioConsultado> {
    const historial = (await this.horarios.historial()).map(aVista);
    return {
      vigente: historial[0],
      historial,
      inicioDeLaNochePorDefecto: INICIO_DE_LA_NOCHE_POR_DEFECTO,
    };
  }
}
