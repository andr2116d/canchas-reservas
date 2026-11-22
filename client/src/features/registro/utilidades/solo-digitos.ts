/** Deja solo los dígitos del texto: para campos que no aceptan letras ni símbolos. */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}
