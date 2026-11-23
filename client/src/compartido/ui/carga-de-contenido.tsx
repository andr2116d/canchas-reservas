import { EsperaDeCancha } from "./espera-de-cancha";
import { LineaDeCesped } from "./linea-de-cesped";
import { PelotaQueRebota } from "./pelota-que-rebota";

/**
 * Carga del contenido mientras el resto de la pantalla se queda quieto: la pelota
 * rebota sola en medio, sobre una línea de césped, y debajo se dice qué se carga.
 * Al entrar o recargar, mientras la página sigue llegando, se ve como la cancha
 * completa (lo decide el CSS con la marca de carga inicial), así hay una sola carga.
 */
export function CargaDeContenido({ texto }: { texto: string }) {
  return (
    <>
      <div className="carga-de-contenido__pantalla">
        <EsperaDeCancha />
      </div>
      <div role="status" className="carga-de-contenido">
        <div className="carga-de-contenido__jugada">
          <PelotaQueRebota tamano="mediana" />
          <LineaDeCesped />
        </div>
        <p className="carga-de-contenido__texto">{texto}</p>
      </div>
    </>
  );
}
