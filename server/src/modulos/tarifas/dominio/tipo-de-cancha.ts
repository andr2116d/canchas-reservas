export const TIPOS_DE_CANCHA = ['FUTBOL_5', 'FUTBOL_7'] as const;

/** Formato de la cancha: las tarifas se definen por tipo, no por cancha. */
export type TipoDeCancha = (typeof TIPOS_DE_CANCHA)[number];

export function esTipoDeCancha(valor: string): valor is TipoDeCancha {
  return (TIPOS_DE_CANCHA as readonly string[]).includes(valor);
}

export const NOMBRE_DEL_TIPO: Record<TipoDeCancha, string> = {
  FUTBOL_5: 'fútbol 5',
  FUTBOL_7: 'fútbol 7',
};
