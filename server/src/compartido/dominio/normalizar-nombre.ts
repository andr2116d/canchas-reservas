/**
 * Forma de un nombre para compararlo y exigir que no se repita: minúsculas,
 * sin tildes y con un solo espacio. «La Única» y «la unica» son el mismo nombre.
 */
export function normalizarNombre(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');
}
