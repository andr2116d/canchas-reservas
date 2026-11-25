import { ReglaInvalidaError } from './dominio.error';
import { momentoEnLima, sumarAFecha } from './momento-en-lima';
import { ValorInvalidoError } from './valor-invalido.error';

export const TAMANOS_DE_PAGINA = [10, 25, 50] as const;

// Una página más allá de este tope no tendría registros.
export const MAXIMA_PAGINA = 100_000;

const vacio = (valor?: string): valor is undefined | '' =>
  valor === undefined || valor.trim() === '';

/** Lee un filtro opcional: vacío queda sin filtrar. */
export function opcional<T>(
  valor: string | undefined,
  leer: (texto: string) => T,
): T | undefined {
  return vacio(valor) ? undefined : leer(valor.trim());
}

/** Un entero de 1 al máximo dado; si no, falla con el mensaje. */
export function entero(texto: string, mensaje: string, maximo: number): number {
  const numero = /^\d{1,10}$/.test(texto) ? Number(texto) : 0;
  if (numero < 1 || numero > maximo) throw new ValorInvalidoError(mensaje);
  return numero;
}

/** Una de las opciones que reconoce `esValido`; si no, falla con el mensaje. */
export function elegirDeLista<T>(
  texto: string,
  esValido: (valor: string) => valor is T & string,
  mensaje: string,
): T {
  if (!esValido(texto)) throw new ValorInvalidoError(mensaje);
  return texto;
}

export function leerTamanoDePagina(texto: string): number {
  const tamano = Number(texto);
  if (!(TAMANOS_DE_PAGINA as readonly number[]).includes(tamano))
    throw new ValorInvalidoError('Muestra 10, 25 o 50 registros por página.');
  return tamano;
}

export function leerPagina(texto: string): number {
  return entero(
    texto,
    `Elige una página del 1 al ${MAXIMA_PAGINA}.`,
    MAXIMA_PAGINA,
  );
}

const enTextoDePeru = (fecha: string) => fecha.split('-').reverse().join('/');

/**
 * Días de Lima, ambos incluidos: `antesDe` es el inicio del día siguiente al final. Un final
 * anterior al inicio se rechaza con su motivo en el campo `hasta`.
 */
export function rangoDeDiasDeLima(
  desde?: string,
  hasta?: string,
): { desde?: Date; antesDe?: Date } {
  if (desde && hasta && hasta < desde)
    throw new ReglaInvalidaError({
      hasta: `La fecha final es anterior a la inicial: elige una fecha desde el ${enTextoDePeru(desde)}.`,
    });
  return {
    ...(desde && { desde: momentoEnLima(desde, '00:00') }),
    ...(hasta && {
      antesDe: momentoEnLima(sumarAFecha(hasta, { dias: 1 }), '00:00'),
    }),
  };
}
