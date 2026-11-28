import type { VersionDelPlazo } from '../dominio/plazo-de-pago.repository';

/** Una versión del plazo lista para mostrar, con los mismos campos que las demás versiones. */
export interface VistaDelPlazo {
  minutos: number;
  guardadaEn: Date;
  guardadaPor: string;
}

export function aVista({
  minutos,
  guardadoEn,
  guardadoPor,
}: VersionDelPlazo): VistaDelPlazo {
  return {
    minutos: minutos.valor,
    guardadaEn: guardadoEn,
    guardadaPor: guardadoPor,
  };
}
