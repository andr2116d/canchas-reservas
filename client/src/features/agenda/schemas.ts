import { z } from "zod";

export const METODOS_CONFIRMACION = ["YAPE", "PLIN", "TRANSFERENCIA", "EFECTIVO"] as const;

export const MENSAJES_CONFIRMAR_PAGO = {
  metodo: "Elige el método de pago",
  monto: "Indica qué monto se pagó",
  numeroOperacion: "El número de operación solo puede tener letras, números y guiones (máximo 30)",
};

export const esquemaConfirmarPago = z.object({
  metodo: z.string().pipe(z.enum(METODOS_CONFIRMACION, MENSAJES_CONFIRMAR_PAGO.metodo)),
  monto: z.enum(["ADELANTO", "TOTAL"], MENSAJES_CONFIRMAR_PAGO.monto),
  numeroOperacion: z
    .string()
    .trim()
    .max(30, MENSAJES_CONFIRMAR_PAGO.numeroOperacion)
    .regex(/^[A-Za-z0-9-]*$/, MENSAJES_CONFIRMAR_PAGO.numeroOperacion)
    .transform((valor) => valor || undefined),
});

export type ValoresConfirmarPago = z.input<typeof esquemaConfirmarPago>;
export type DatosFormularioPago = z.output<typeof esquemaConfirmarPago>;
