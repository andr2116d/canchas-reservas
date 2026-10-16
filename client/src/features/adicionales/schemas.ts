import { z } from "zod";

export const MENSAJES_ADICIONAL = {
  nombreObligatorio: "El nombre es obligatorio",
  nombreLongitud: "El nombre debe tener entre 2 y 40 caracteres",
  precioObligatorio: "El precio es obligatorio",
  precioFormato: "El precio debe ser un número con hasta 2 decimales",
  precioPositivo: "El precio debe ser mayor que cero",
  precioMaximo: "El precio no puede superar S/ 9999.99",
};

const PRECIO = /^\d+(\.\d{1,2})?$/;

export const esquemaAdicional = z.object({
  nombre: z
    .string(MENSAJES_ADICIONAL.nombreObligatorio)
    .trim()
    .min(2, MENSAJES_ADICIONAL.nombreLongitud)
    .max(40, MENSAJES_ADICIONAL.nombreLongitud),
  precio: z
    .string(MENSAJES_ADICIONAL.precioObligatorio)
    .trim()
    .min(1, MENSAJES_ADICIONAL.precioObligatorio)
    .regex(PRECIO, MENSAJES_ADICIONAL.precioFormato)
    .transform(Number)
    .refine((valor) => valor > 0, MENSAJES_ADICIONAL.precioPositivo)
    .refine((valor) => valor <= 9999.99, MENSAJES_ADICIONAL.precioMaximo),
});

export type ValoresAdicional = z.input<typeof esquemaAdicional>;
export type DatosAdicional = z.output<typeof esquemaAdicional>;
