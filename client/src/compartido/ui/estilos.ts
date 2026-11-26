/** Acción principal de las pantallas internas. */
export const BOTON_PRINCIPAL =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-botella px-6 py-3 font-bold text-papel " +
  "transition-colors hover:bg-botella-oscura focus-visible:outline-3 focus-visible:outline-offset-2 " +
  "focus-visible:outline-botella disabled:cursor-wait disabled:opacity-70";

/** Acción de apoyo, como generar un dato o cancelar. */
export const BOTON_SECUNDARIO =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-linea bg-papel px-4 py-2 " +
  "text-sm font-bold text-botella transition-colors hover:border-botella/40 hover:bg-tiza " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella disabled:opacity-60";

/** Acción principal sobre la cancha del encabezado: amarillo capitán para que resalte. */
export const BOTON_SOBRE_CANCHA =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-capitan px-6 py-3 font-bold text-tinta " +
  "shadow-[0_8px_20px_-10px_rgb(0_0_0/0.6)] transition-colors hover:bg-papel focus-visible:outline-3 " +
  "focus-visible:outline-offset-2 focus-visible:outline-capitan";

/** Bloque blanco que agrupa un formulario o una sección de la ficha. */
export const TARJETA = "rounded-2xl border border-white/80 bg-papel p-5 shadow-sm sm:p-7";
