/** Formato de la cancha. Las tarifas se definen por tipo y cada cancha tiene uno. */
export type TipoDeCancha = "FUTBOL_5" | "FUTBOL_7";

export const TIPOS_DE_CANCHA: TipoDeCancha[] = ["FUTBOL_5", "FUTBOL_7"];

export const NOMBRE_DEL_TIPO: Record<TipoDeCancha, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_7: "Fútbol 7",
};
