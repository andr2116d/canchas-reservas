/** Forma de comparar nombres: sin mayúsculas, tildes ni espacios de más. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
}

/** Los siguientes nombres «Cancha N» libres, para proponerlos en el alta. */
export function nombresSugeridos(existentes: string[], cantidad: number): string[] {
  const usados = new Set(existentes.map(normalizarNombre));
  const libres: string[] = [];
  for (let numero = 1; libres.length < cantidad; numero++) {
    const nombre = `Cancha ${numero}`;
    if (!usados.has(normalizarNombre(nombre))) libres.push(nombre);
  }
  return libres;
}
