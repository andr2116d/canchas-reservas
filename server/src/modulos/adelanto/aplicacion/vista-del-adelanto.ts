import type { VersionDelAdelanto } from '../dominio/adelanto.repository';

/** Una versión del adelanto lista para mostrar, con los mismos campos que las demás versiones. */
export interface VistaDelAdelanto {
  porcentaje: number;
  guardadaEn: Date;
  guardadaPor: string;
}

export function aVista({
  porcentaje,
  guardadoEn,
  guardadoPor,
}: VersionDelAdelanto): VistaDelAdelanto {
  return {
    porcentaje: porcentaje.valor,
    guardadaEn: guardadoEn,
    guardadaPor: guardadoPor,
  };
}
