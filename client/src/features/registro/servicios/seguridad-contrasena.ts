import type { ZxcvbnFactory } from "@zxcvbn-ts/core";

export type NivelDeSeguridad = "debil" | "aceptable" | "buena" | "muy-buena";

export interface SeguridadDeContrasena {
  nivel: NivelDeSeguridad;
  /** Por qué es fácil de adivinar, en español; solo si hay algo que advertir. */
  aviso?: string;
}

// Puntaje de zxcvbn (0 a 4): qué tan difícil es adivinarla.
const NIVEL_POR_PUNTAJE: NivelDeSeguridad[] = ["debil", "debil", "aceptable", "buena", "muy-buena"];

// Palabras del sitio que alguien podría usar como contraseña.
const PALABRAS_DEL_SITIO = ["la previa", "laprevia", "previa", "cancha", "pichanga", "futbol", "trujillo"];

let analizador: Promise<ZxcvbnFactory> | undefined;

/**
 * Carga los diccionarios (varios MB) solo la primera vez que se analiza una
 * contraseña, para no hacer más pesada la carga de la página.
 */
function cargarAnalizador(): Promise<ZxcvbnFactory> {
  analizador ??= Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-es-es"),
  ]).then(
    ([nucleo, comun, espanol]) =>
      new nucleo.ZxcvbnFactory({
        translations: espanol.translations,
        graphs: comun.adjacencyGraphs,
        dictionary: { ...comun.dictionary, ...espanol.dictionary },
        useLevenshteinDistance: true,
      }),
  );
  return analizador;
}

/**
 * Estima qué tan fácil es adivinar la contraseña (zxcvbn), considerando
 * contraseñas comunes, palabras en español y los datos de la propia persona.
 */
export async function analizarContrasena(
  contrasena: string,
  datosPersonales: string[],
): Promise<SeguridadDeContrasena> {
  const resultado = (await cargarAnalizador()).check(contrasena, [
    ...datosPersonales.filter(Boolean),
    ...PALABRAS_DEL_SITIO,
  ]);
  const nivel = NIVEL_POR_PUNTAJE[resultado.score];
  const aviso = resultado.feedback.warning;
  return aviso ? { nivel, aviso } : { nivel };
}
