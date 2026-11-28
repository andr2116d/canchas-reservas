import { z } from "zod";

const minutos = z.string().refine((valor) => /^\d{1,3}$/.test(valor) && Number(valor) <= 120, "Ingresa un número entero de 0 a 120.");
export const esquemaDeVentana = z.object({ minutosAntes: minutos, minutosDespues: minutos });
export type DatosDeVentana = z.infer<typeof esquemaDeVentana>;
