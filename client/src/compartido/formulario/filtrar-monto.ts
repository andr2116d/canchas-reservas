const CIFRAS_ENTERAS = 5;

/**
 * Deja escribir un monto en soles: solo cifras, un separador (punto o coma),
 * hasta dos decimales y hasta cinco cifras enteras.
 */
export function filtrarMonto(valor: string): string {
  const limpio = valor.replace(/[^\d.,]/g, "");
  const separador = limpio.search(/[.,]/);
  if (separador === -1) return limpio.slice(0, CIFRAS_ENTERAS);
  const enteros = limpio.slice(0, separador).slice(0, CIFRAS_ENTERAS);
  const decimales = limpio
    .slice(separador + 1)
    .replace(/[.,]/g, "")
    .slice(0, 2);
  return `${enteros}${limpio[separador]}${decimales}`;
}
