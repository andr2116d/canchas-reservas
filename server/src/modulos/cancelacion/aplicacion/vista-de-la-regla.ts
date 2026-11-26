import type { RangoDeCancelacion } from '../dominio/regla-de-cancelacion';
import type { VersionDeLaRegla } from '../dominio/regla-de-cancelacion.repository';

/** Una versión de la regla lista para mostrar, con sus rangos de más a menos anticipación. */
export interface VistaDeLaRegla {
  rangos: RangoDeCancelacion[];
  guardadaEn: Date;
  guardadaPor: string;
}

export function aVista({
  regla,
  guardadaEn,
  guardadaPor,
}: VersionDeLaRegla): VistaDeLaRegla {
  return { rangos: [...regla.rangos], guardadaEn, guardadaPor };
}
