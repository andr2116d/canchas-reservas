/** Secciones de la portada, con la ruta completa para que sirvan desde cualquier página. */
export const SECCIONES_DE_LA_PORTADA = [
  { ruta: "/#canchas", texto: "Canchas" },
  { ruta: "/#precios", texto: "Precios" },
  { ruta: "/#turnos", texto: "Turnos libres" },
  { ruta: "/#como-reservar", texto: "Cómo reservar" },
  { ruta: "/#preguntas", texto: "Preguntas" },
  { ruta: "/#contacto", texto: "Contacto" },
] as const;

/** Páginas legales que exige el marco legal, enlazadas desde el pie. */
export const PAGINAS_LEGALES = [
  { ruta: "/legal/terminos", texto: "Términos y condiciones" },
  { ruta: "/legal/privacidad", texto: "Política de privacidad" },
  { ruta: "/legal/cancelaciones", texto: "Cancelaciones y devoluciones" },
  { ruta: "/legal/cookies", texto: "Política de cookies" },
] as const;

export const RUTA_DEL_LIBRO_DE_RECLAMACIONES = "/libro-de-reclamaciones";
