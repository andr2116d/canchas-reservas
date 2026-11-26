import { PelotaQueRebota } from "./pelota-que-rebota";

/**
 * Carga a pantalla completa, solo cuando todavía no hay nada que mostrar (entrar
 * al sitio o al panel): la cancha entera y la pelota rebotando en el círculo central.
 */
export function EsperaDeCancha({ texto = "Cargando La Previa…" }: { texto?: string }) {
  return (
    <div role="status" className="cancha-completa espera-de-cancha">
      <div className="espera-de-cancha__centro">
        <PelotaQueRebota tamano="grande" />
        <p className="espera-de-cancha__texto">{texto}</p>
      </div>
    </div>
  );
}
