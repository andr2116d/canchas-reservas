import { EsperaDeCancha } from "./espera-de-cancha";
import { LineaDeCesped } from "./linea-de-cesped";
import { PelotaQueRebota } from "./pelota-que-rebota";

/**
 * La pelota rebota sobre una línea de césped y debajo se dice qué se carga. En la
 * carga inicial el CSS la muestra como la cancha completa, para que haya una sola carga.
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
