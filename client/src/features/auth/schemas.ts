import { z } from "zod";

export const esquemaLogin = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email("Ingresa un correo válido")),
  contrasena: z.string().min(1, "Ingresa tu contraseña"),
});

export type ValoresLogin = z.input<typeof esquemaLogin>;
