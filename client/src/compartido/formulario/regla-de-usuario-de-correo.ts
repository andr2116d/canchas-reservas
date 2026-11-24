import type { Regla } from "./reglas-de-datos-personales";

// Parte de un correo antes de la @ (estándar HTML de WHATWG).
const USUARIO_DE_CORREO = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
export const LARGO_DEL_USUARIO_DE_CORREO = 64;

/** Lo que va antes de la @ de un correo institucional; `siVacio` dice qué hacer si falta. */
export function reglaDeUsuarioDeCorreo(siVacio: string): Regla {
  return (valor) => {
    const limpio = valor.trim();
    if (limpio === "") return siVacio;
    if (!USUARIO_DE_CORREO.test(limpio)) return "Escribe solo lo que va antes de la @, sin espacios.";
    if (limpio.length > LARGO_DEL_USUARIO_DE_CORREO) return "El correo no puede tener más de 64 caracteres antes de la @.";
  };
}
