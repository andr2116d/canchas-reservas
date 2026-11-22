import type { LabelHTMLAttributes } from "react";

/** Etiqueta de un dato obligatorio: el asterisco es visual, el campo lleva `required`. */
export function EtiquetaObligatoria({ children, ...etiqueta }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="text-sm font-semibold text-tinta" {...etiqueta}>
      {children}
      <span aria-hidden="true" className="ml-0.5 text-error">
        *
      </span>
    </label>
  );
}
