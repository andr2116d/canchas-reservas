import {
  type Entorno,
  leerEntero,
} from '../../../../compartido/infraestructura/configuracion/configuracion';

/** Hojas por hora desde una IP; 10 si no se configura. */
export function leerLimiteDeHojas(entorno: Entorno): number {
  return leerEntero(entorno, 'LIMITE_HOJAS_POR_HORA', 10);
}
