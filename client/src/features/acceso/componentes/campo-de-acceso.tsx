import type { ComponentPropsWithRef } from "react";

type CampoDeAccesoProps = ComponentPropsWithRef<"input"> & { etiqueta: string; id: string };

/** Campo del formulario de acceso con etiqueta visible. */
export function CampoDeAcceso({ etiqueta, id, ...propiedades }: CampoDeAccesoProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-bold text-tinta">
      <span>{etiqueta}</span>
      <input id={id} required {...propiedades} className="min-h-12 w-full rounded-lg border border-linea bg-papel px-3 text-base font-normal outline-none focus-visible:border-botella focus-visible:ring-2 focus-visible:ring-botella/30" />
    </label>
  );
}
