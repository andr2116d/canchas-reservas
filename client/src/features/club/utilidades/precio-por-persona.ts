import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

/** Jugadores en cancha de cada tipo: cinco o siete por equipo. */
export const JUGADORES: Record<TipoDeCancha, number> = { FUTBOL_5: 10, FUTBOL_7: 14 };

/** Cuánto pone cada jugador si el turno se divide entre todos, redondeado hacia arriba al céntimo. */
export function precioPorPersona(precio: string, tipo: TipoDeCancha): string {
  const centimos = Math.round(Number(precio) * 100);
  const porPersona = Math.ceil(centimos / JUGADORES[tipo]);
  return `${Math.floor(porPersona / 100)}.${String(porPersona % 100).padStart(2, "0")}`;
}
