import { LARGOS } from "./reglas-de-datos-personales";

/** Solo dígitos y hasta un largo: lo que sobra se descarta al escribir o pegar. */
const digitosHasta =
  (maximo: number) =>
  (valor: string): string =>
    valor.replace(/\D/g, "").slice(0, maximo);

/** DNI: solo números, máximo 8. */
export const filtrarDni = digitosHasta(LARGOS.dni);

/** Celular: solo números, máximo 9. */
export const filtrarCelular = digitosHasta(LARGOS.celular);

/** Dorsal: solo números, máximo 2 (del 1 al 99). */
export const filtrarDorsal = digitosHasta(LARGOS.dorsal);

/** Carné de extranjería: letras y números en mayúscula, máximo 12. */
export function filtrarCarneExtranjeria(valor: string): string {
  return valor
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, LARGOS.carneMaximo);
}
