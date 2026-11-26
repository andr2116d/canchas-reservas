import { DibujoDelBalon } from "./dibujo-del-balon";

export type TamanoDeLaPelota = "grande" | "mediana" | "boton";

/**
 * Pelota que rebota sobre el césped: cae acelerando, se aplasta al tocar, sube
 * frenando y gira; su sombra crece al acercarse al piso. Es solo decoración: quien
 * la usa dice con texto qué se está cargando.
 */
export function PelotaQueRebota({ tamano }: { tamano: TamanoDeLaPelota }) {
  return (
    <span aria-hidden="true" className={`pelota-que-rebota pelota-que-rebota--${tamano}`}>
      <span className="pelota-que-rebota__salto">
        <span className="pelota-que-rebota__forma">
          <svg viewBox="-12 -12 24 24" focusable="false">
            <DibujoDelBalon claseDeLosGajos="pelota-que-rebota__gajos" />
          </svg>
        </span>
      </span>
      <span className="pelota-que-rebota__sombra" />
    </span>
  );
}
