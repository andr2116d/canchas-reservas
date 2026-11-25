import { io } from "socket.io-client";

/** Ruta de socket.io en el server, bajo /api para pasar por el mismo origen. */
const RUTA = "/api/tiempo-real";

export type EstadoDeLaConexion = "conectado" | "reconectando";

interface AvisosDeCambios {
  alCambiar: () => void;
  alCambiarConexion: (estado: EstadoDeLaConexion) => void;
}

/**
 * Escucha los avisos de cambio del mapa de turnos. Al reconectarse avisa un cambio,
 * por si algo pasó mientras no había conexión. Devuelve cómo dejar de escuchar.
 */
export function escucharCambios({ alCambiar, alCambiarConexion }: AvisosDeCambios): () => void {
  const canal = io("/disponibilidad", { path: RUTA });
  let primeraConexion = true;
  canal.on("cambio", alCambiar);
  canal.on("connect", () => {
    alCambiarConexion("conectado");
    if (!primeraConexion) alCambiar();
    primeraConexion = false;
  });
  canal.on("disconnect", () => alCambiarConexion("reconectando"));
  return () => {
    canal.close();
  };
}
