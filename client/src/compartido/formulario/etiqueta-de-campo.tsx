import type { LabelHTMLAttributes } from "react";

interface EtiquetaDeCampoProps extends LabelHTMLAttributes<HTMLLabelElement> {
  opcional?: boolean;
}

/**
 * Etiqueta de un campo. Los obligatorios llevan un asterisco visual (el campo
 * lleva `required`); los opcionales lo dicen con texto.
 */
export function EtiquetaDeCampo({ opcional = false, children, ...etiqueta }: EtiquetaDeCampoProps) {
  return (
    <label className="text-sm font-semibold text-tinta" {...etiqueta}>
      {children}
      {opcional ? (
        <span className="ml-1 font-normal text-grava">(opcional)</span>
      ) : (
        <span aria-hidden="true" className="ml-0.5 text-error">
          *
        </span>
      )}
    </label>
  );
}
