import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

/** Detalles que el jugador ve en la ficha de la cancha, en el orden en que se muestran. */
export const CARACTERISTICAS_DE_CANCHA = [
  'TECHADA',
  'BANCAS',
  'JUNTO_A_LA_PARED',
  'GRADERIAS',
  'MALLA_ALTA',
  'VESTUARIO_CERCA',
] as const;

export type CaracteristicaDeCancha = (typeof CARACTERISTICAS_DE_CANCHA)[number];

function esCaracteristica(valor: string): valor is CaracteristicaDeCancha {
  return (CARACTERISTICAS_DE_CANCHA as readonly string[]).includes(valor);
}

/** Acepta solo detalles de la lista; los devuelve sin repetir y en el orden de la lista. */
export function leerCaracteristicas(
  valores: string[],
): CaracteristicaDeCancha[] {
  if (!valores.every(esCaracteristica))
    throw new ValorInvalidoError('Elige los detalles de la lista.');
  return CARACTERISTICAS_DE_CANCHA.filter((caracteristica) =>
    valores.includes(caracteristica),
  );
}
