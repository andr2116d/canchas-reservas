import type { EstadoDeLaConexion } from "../servicios/avisos-de-cambios";

/** Dice si el mapa se está actualizando solo o si se perdió la conexión en vivo. */
export function EstadoEnVivo({ conexion, cargando }: { conexion: EstadoDeLaConexion; cargando: boolean }) {
  return (
    <p data-conexion={conexion} className="en-vivo inline-flex items-center gap-2 rounded-full border border-linea bg-papel px-3 py-1.5 text-xs font-semibold text-botella">
      <span aria-hidden="true" className="en-vivo__punto" />
      {conexion === "conectado" ? "En vivo" : "Reconectando…"}
      {cargando && <span className="text-grava">· actualizando</span>}
    </p>
  );
}
