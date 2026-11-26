/** Detalle de una cancha que administración puede marcar. */
export type Caracteristica = "TECHADA" | "BANCAS" | "JUNTO_A_LA_PARED" | "GRADERIAS" | "MALLA_ALTA" | "VESTUARIO_CERCA";

/** Detalles que se pueden marcar, en el orden en que se muestran. */
export const CARACTERISTICAS: { valor: Caracteristica; texto: string }[] = [
  { valor: "TECHADA", texto: "Techada" },
  { valor: "BANCAS", texto: "Bancas" },
  { valor: "JUNTO_A_LA_PARED", texto: "Junto a la pared" },
  { valor: "GRADERIAS", texto: "Graderías" },
  { valor: "MALLA_ALTA", texto: "Malla alta" },
  { valor: "VESTUARIO_CERCA", texto: "Vestuario cerca" },
];

export const TEXTO_DE_CARACTERISTICA = Object.fromEntries(
  CARACTERISTICAS.map(({ valor, texto }) => [valor, texto]),
) as Record<Caracteristica, string>;
