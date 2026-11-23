import type { VersionDeTarifa } from '../dominio/tarifa.repository';

/** Tarifa lista para mostrar: montos en soles con dos decimales. */
export interface VistaDeTarifa {
  precioDia: string;
  precioNoche: string;
  duracionDelTurnoHoras: number;
  ofreceTurnoCorto: boolean;
  guardadaEn: Date;
  guardadaPor: string;
}

export function aVista({
  tarifa,
  guardadaEn,
  guardadaPor,
}: VersionDeTarifa): VistaDeTarifa {
  return {
    precioDia: tarifa.precioDia.enSoles(),
    precioNoche: tarifa.precioNoche.enSoles(),
    duracionDelTurnoHoras: tarifa.duracion.horas,
    ofreceTurnoCorto: tarifa.ofreceTurnoCorto,
    guardadaEn,
    guardadaPor,
  };
}
