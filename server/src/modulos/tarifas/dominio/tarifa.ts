import type { DuracionDelTurno } from './duracion-del-turno.value-object';
import type { Monto } from './monto.value-object';
import type { TipoDeCancha } from './tipo-de-cancha';

/** Precio de un turno de un tipo de cancha, de día y de noche, y cuánto dura ese turno. */
export class Tarifa {
  constructor(
    readonly tipo: TipoDeCancha,
    readonly precioDia: Monto,
    readonly precioNoche: Monto,
    readonly duracion: DuracionDelTurno,
  ) {}

  /** Mismos precios y misma duración: guardarla otra vez no es un cambio. */
  igualA(otra: Tarifa): boolean {
    return (
      this.tipo === otra.tipo &&
      this.precioDia.centimos === otra.precioDia.centimos &&
      this.precioNoche.centimos === otra.precioNoche.centimos &&
      this.duracion.horas === otra.duracion.horas
    );
  }
}
