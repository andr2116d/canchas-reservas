import { Injectable } from '@nestjs/common';
import { HorarioService } from '../horario/horario.service';
import { generarTurnos, type Turno } from './generar-turnos';

@Injectable()
export class TurnosService {
  constructor(private readonly horario: HorarioService) {}

  async generar(fecha: string): Promise<Turno[]> {
    const { dia, inicioNoche } = await this.horario.diaDe(fecha);
    return generarTurnos(dia, inicioNoche);
  }
}
