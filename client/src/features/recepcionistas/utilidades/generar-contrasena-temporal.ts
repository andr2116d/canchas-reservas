// Sin 0, O, 1, l ni I: se confunden al dictar la contraseña o al leerla en pantalla.
const LETRAS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMEROS = "23456789";
const LARGO = 10;

function alAzar(caracteres: string, cantidad: number): string[] {
  const valores = crypto.getRandomValues(new Uint32Array(cantidad));
  return Array.from(valores, (valor) => caracteres[valor % caracteres.length]);
}

/**
 * Contraseña temporal de 10 caracteres, con letras y números, generada con el
 * azar criptográfico del navegador. La recepcionista la cambia al entrar.
 */
export function generarContrasenaTemporal(): string {
  const caracteres = [...alAzar(LETRAS, LARGO - 3), ...alAzar(NUMEROS, 3)];
  const orden = crypto.getRandomValues(new Uint32Array(caracteres.length));
  return caracteres
    .map((caracter, posicion) => ({ caracter, orden: orden[posicion] }))
    .sort((a, b) => a.orden - b.orden)
    .map(({ caracter }) => caracter)
    .join("");
}
