import { z } from "zod";

export const VALOR_MAXIMO = 9999.99;

export const MENSAJES_TARIFA = {
  valorPositivo: "El valor debe ser mayor que 0",
  valorMaximo: "El valor no puede ser mayor que 9999.99",
  valorDecimales: "El valor debe tener hasta 2 decimales",
};

const NUMERO = /^-?\d+(\.\d+)?$/;
const HASTA_DOS_DECIMALES = /^-?\d+(\.\d{1,2})?$/;

export const esquemaTarifa = z.object({
  valor: z
    .string(MENSAJES_TARIFA.valorPositivo)
    .trim()
    .regex(NUMERO, MENSAJES_TARIFA.valorPositivo)
    .transform(Number)
    .refine((valor) => valor > 0, MENSAJES_TARIFA.valorPositivo)
    .refine((valor) => HASTA_DOS_DECIMALES.test(String(valor)), MENSAJES_TARIFA.valorDecimales)
    .refine((valor) => valor <= VALOR_MAXIMO, MENSAJES_TARIFA.valorMaximo),
});

export type ValoresTarifa = z.input<typeof esquemaTarifa>;
export type DatosTarifaFormulario = z.output<typeof esquemaTarifa>;

/**
 * Deja escribir solo cifras y un separador decimal, con hasta 2 decimales.
 * La coma se toma como punto.
 */
export function sanearValor(valor: string): string {
  const limpio = valor.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [entero, ...resto] = limpio.split(".");
  if (resto.length === 0) return entero;
  return `${entero}.${resto.join("").slice(0, 2)}`;
}
