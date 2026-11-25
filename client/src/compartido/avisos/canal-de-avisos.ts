import { io, type Socket } from "socket.io-client";

const RUTA = "/api/tiempo-real";
const oyentes = new Set<() => void>();
let canal: Socket | undefined;

function abrir(): Socket {
  // Sin barra final: así la ruta coincide con el rewrite de /api en Next. La cookie de sesión va sola.
  const nuevo = io("/avisos", { path: RUTA, addTrailingSlash: false });
  let primeraConexion = true;
  const avisarATodos = () => oyentes.forEach((oyente) => oyente());
  nuevo.on("avisos", avisarATodos);
  nuevo.on("connect", () => {
    // Tras reconectarse se vuelve a pedir, por si llegó algo mientras no había conexión.
    if (!primeraConexion) avisarATodos();
    primeraConexion = false;
  });
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
