import { Injectable } from '@nestjs/common';
import type { HorarioDeFranjas } from '../../aplicacion/horario-de-franjas.port';
import { HoraDelDia } from '../../../../compartido/dominio/hora-del-dia.value-object';

/** La noche empieza a las 18:00 hasta que el horario del local sea configurable. */
@Injectable()
export class HorarioFijoDeFranjasAdapter implements HorarioDeFranjas {
  inicioDeLaNoche(): Promise<HoraDelDia> {
    return Promise.resolve(HoraDelDia.crear('18:00'));
  }
}
