import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import { type CanchaEnEdicion, erroresDeCancha } from "../esquemas/cancha.schema";
import type { Caracteristica, DatosDeCancha } from "../servicios/canchas";
import { nombresSugeridos, normalizarNombre } from "./nombres-sugeridos";

export const MAXIMO_POR_TIPO = 20;

/** Una cancha en el alta individual; el nombre vacío de inicio toma el sugerido. */
export interface AltaIndividual extends CanchaEnEdicion {
  caracteristicas: Caracteristica[];
}

/** Varias canchas que comparten luz y detalles; cada una con su nombre. */
export interface AltaEnGrupo {
  cantidad: Record<TipoDeCancha, number>;
  tieneIluminacion: boolean | null;
  caracteristicas: Caracteristica[];
  /** Nombres que se cambiaron a mano, por clave de cancha. */
  nombres: Record<string, string>;
}

export interface CanchaPropuesta {
  clave: string;
  tipo: TipoDeCancha;
  nombre: string;
  /** Texto para lectores de pantalla, como «Nombre de la cancha 2 de fútbol 5». */
  etiqueta: string;
}

export type Preparacion = { lista?: DatosDeCancha[]; errores: Record<string, string> };

/** Las canchas del grupo con su nombre: el cambiado a mano o el siguiente «Cancha N» libre. */
export function canchasPropuestas(grupo: AltaEnGrupo, existentes: string[]): CanchaPropuesta[] {
  const total = TIPOS_DE_CANCHA.reduce((suma, tipo) => suma + grupo.cantidad[tipo], 0);
  const sugeridos = nombresSugeridos(existentes, total);
  let siguiente = 0;
  return TIPOS_DE_CANCHA.flatMap((tipo) =>
    Array.from({ length: grupo.cantidad[tipo] }, (_, indice) => {
      const clave = `${tipo}-${indice}`;
      return {
        clave,
        tipo,
        nombre: grupo.nombres[clave] ?? sugeridos[siguiente++],
        etiqueta: `Nombre de la cancha ${indice + 1} de ${NOMBRE_DEL_TIPO[tipo].toLowerCase()}`,
      };
    }),
  );
}

export function prepararIndividual(alta: AltaIndividual): Preparacion {
  const errores = erroresDeCancha(alta) as Record<string, string>;
  if (Object.keys(errores).length > 0 || !alta.tipo || alta.tieneIluminacion === null) return { errores };
  const { nombre, tipo, tieneIluminacion, caracteristicas } = alta;
  return { errores, lista: [{ nombre: nombre.trim(), tipo, tieneIluminacion, caracteristicas }] };
}

function errorDelNombre(nombre: string, repetidos: Set<string>, existentes: Set<string>): string | undefined {
  const deFormato = erroresDeCancha({ nombre, tipo: "FUTBOL_5", tieneIluminacion: true }).nombre;
  if (deFormato) return deFormato;
  if (existentes.has(normalizarNombre(nombre))) return "Ya hay una cancha con este nombre.";
  if (repetidos.has(normalizarNombre(nombre))) return "Este nombre se repite en la lista.";
}

/** Revisa el grupo: cuántas, la luz y que cada nombre esté, no se repita y no lo use otra cancha. */
export function prepararGrupo(grupo: AltaEnGrupo, existentes: string[]): Preparacion {
  const propuestas = canchasPropuestas(grupo, existentes);
  const errores: Record<string, string> = {};
  if (propuestas.length === 0) errores.cantidad = "Elige cuántas canchas agregar.";
  if (grupo.tieneIluminacion === null) errores.tieneIluminacion = "Indica si tienen luz para jugar de noche.";
  const normalizados = propuestas.map((p) => normalizarNombre(p.nombre));
  const repetidos = new Set(normalizados.filter((n, i) => normalizados.indexOf(n) !== i));
  const usados = new Set(existentes.map(normalizarNombre));
  for (const propuesta of propuestas) {
    const error = errorDelNombre(propuesta.nombre, repetidos, usados);
    if (error) errores[`nombre-${propuesta.clave}`] = error;
  }
  if (Object.keys(errores).length > 0 || grupo.tieneIluminacion === null) return { errores };
  const { tieneIluminacion, caracteristicas } = grupo;
  return { errores, lista: propuestas.map(({ nombre, tipo }) => ({ nombre: nombre.trim(), tipo, tieneIluminacion, caracteristicas })) };
}

/** Lleva los errores del server (`canchas.1.nombre`) al campo de la pantalla. */
export function erroresDelServer(errores: Record<string, string>, propuestas?: CanchaPropuesta[]): Record<string, string> {
  const traducidos: Record<string, string> = {};
  for (const [clave, mensaje] of Object.entries(errores)) {
    const [, posicion, campo] = clave.match(/^canchas\.(\d+)\.(\w+)$/) ?? [];
    if (!campo) traducidos.general = mensaje;
    else if (propuestas && campo === "nombre") traducidos[`nombre-${propuestas[Number(posicion)]?.clave}`] = mensaje;
    else traducidos[campo] = mensaje;
  }
  return traducidos;
}
