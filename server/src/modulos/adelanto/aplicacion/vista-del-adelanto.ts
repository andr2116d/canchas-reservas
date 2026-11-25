import type { VersionDelAdelanto } from '../dominio/adelanto.repository';

/** Una versión del adelanto lista para mostrar. */
export interface VistaDelAdelanto {
  porcentaje: number;
  guardadoEn: Date;
  guardadoPor: string;
}

export function aVista({
  porcentaje,
  guardadoEn,
  guardadoPor,
}: VersionDelAdelanto): VistaDelAdelanto {
  return { porcentaje: porcentaje.valor, guardadoEn, guardadoPor };
}
