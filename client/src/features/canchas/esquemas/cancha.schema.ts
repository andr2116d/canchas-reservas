import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

const LARGO_MAXIMO_DEL_NOMBRE = 40;

/** Cancha en edición: el tamaño y la luz empiezan sin elegir. */
export interface CanchaEnEdicion {
  nombre: string;
  tipo: TipoDeCancha | null;
  tieneIluminacion: boolean | null;
}

export type ErroresDeCancha = Partial<Record<keyof CanchaEnEdicion, string>>;

/** Revisa el formato antes de enviar; el nombre repetido y el resto de reglas los revisa el server. */
export function erroresDeCancha({ nombre, tipo, tieneIluminacion }: CanchaEnEdicion): ErroresDeCancha {
  const errores: ErroresDeCancha = {};
  if (!nombre.trim()) errores.nombre = "Escribe el nombre de la cancha.";
  else if (nombre.trim().length > LARGO_MAXIMO_DEL_NOMBRE) errores.nombre = `Usa como máximo ${LARGO_MAXIMO_DEL_NOMBRE} caracteres.`;
  if (!tipo) errores.tipo = "Elige si es de fútbol 5 o de fútbol 7.";
  if (tieneIluminacion === null) errores.tieneIluminacion = "Indica si tiene luz para jugar de noche.";
  return errores;
}
