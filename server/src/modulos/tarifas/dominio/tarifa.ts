import type { DuracionDelTurno } from './duracion-del-turno.value-object';
import type { Monto } from '../../../compartido/dominio/monto.value-object';
import type { TipoDeCancha } from './tipo-de-cancha';

export interface DatosDeLaTarifa {
  tipo: TipoDeCancha;
  precioDia: Monto;
  precioNoche: Monto;
  duracion: DuracionDelTurno;
  /** Si el rato final del día que no alcanza para un turno se ofrece como turno corto. */
  ofreceTurnoCorto: boolean;
}

/** Precio de un turno de un tipo de cancha, de día y de noche, y cuánto dura ese turno. */
export class Tarifa {
  readonly tipo: TipoDeCancha;
  readonly precioDia: Monto;
  readonly precioNoche: Monto;
  readonly duracion: DuracionDelTurno;
  readonly ofreceTurnoCorto: boolean;

  constructor(datos: DatosDeLaTarifa) {
    this.tipo = datos.tipo;
    this.precioDia = datos.precioDia;
    this.precioNoche = datos.precioNoche;
    this.duracion = datos.duracion;
    this.ofreceTurnoCorto = datos.ofreceTurnoCorto;
  }

  /** Mismos precios, duración y turno corto: guardarla otra vez no es un cambio. */
  igualA(otra: Tarifa): boolean {
    return (
      this.tipo === otra.tipo &&
      this.precioDia.centimos === otra.precioDia.centimos &&
      this.precioNoche.centimos === otra.precioNoche.centimos &&
      this.duracion.horas === otra.duracion.horas &&
      this.ofreceTurnoCorto === otra.ofreceTurnoCorto
    );
  }
}
