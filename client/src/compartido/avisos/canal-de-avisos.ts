import { io, type Socket } from "socket.io-client";

const RUTA = "/api/tiempo-real";
const oyentes = new Set<() => void>();
let canal: Socket | undefined;

function abrir(): Socket {
  // Sin barra final: así la ruta coincide con el rewrite de /api en Next. La cookie de sesión va sola.
  const nuevo = io("/avisos", { path: RUTA, addTrailingSlash: false });
  const avisarATodos = () => oyentes.forEach((oyente) => oyente());
  nuevo.on("avisos", avisarATodos);
  // Al conectarse (la primera vez y al volver) se pide de nuevo: un aviso pudo llegar mientras
  // el canal aún no estaba abierto.
  nuevo.on("connect", avisarATodos);
  return nuevo;
}

/**
 * Escucha los avisos nuevos de la persona con sesión. Todas las piezas de la pantalla comparten
 * un solo canal, que se cierra cuando nadie lo escucha. Devuelve cómo dejar de escuchar.
 */
export function escucharAvisos(alLlegar: () => void): () => void {
  oyentes.add(alLlegar);
  canal ??= abrir();
  return () => {
    oyentes.delete(alLlegar);
    if (oyentes.size === 0) {
      canal?.close();
      canal = undefined;
    }
  };
}
