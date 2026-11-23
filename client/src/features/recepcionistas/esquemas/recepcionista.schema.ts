import { z } from "zod";
import {
  camposDeDatosPersonales,
  campoCon,
  reglaDeContrasena,
  validarDocumento,
  type Regla,
} from "@/compartido/formulario/reglas-de-datos-personales";

// Parte de un correo antes de la @ (estándar HTML de WHATWG).
const USUARIO_DE_CORREO = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
export const LARGO_DEL_USUARIO_DE_CORREO = 64;

const reglaDeUsuarioDeCorreo: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Escribe el correo o genéralo con sus nombres.";
  if (!USUARIO_DE_CORREO.test(limpio)) return "Escribe solo lo que va antes de la @, sin espacios.";
  if (limpio.length > LARGO_DEL_USUARIO_DE_CORREO) return "El correo no puede tener más de 64 caracteres antes de la @.";
};

const camposDeRecepcionista = {
  ...camposDeDatosPersonales("ajena"),
  usuarioDeCorreo: campoCon(reglaDeUsuarioDeCorreo),
};

/** Datos que el administrador edita de una recepcionista. */
export const esquemaDeEdicion = z.object(camposDeRecepcionista).superRefine(validarDocumento("ajena"));

/** Alta: los mismos datos más la contraseña temporal. */
export const esquemaDeAlta = z
  .object({ ...camposDeRecepcionista, contrasena: campoCon(reglaDeContrasena) })
  .superRefine(validarDocumento("ajena"));

export type DatosDeEdicion = z.infer<typeof esquemaDeEdicion>;
export type DatosDeAlta = z.infer<typeof esquemaDeAlta>;

/** Contraseña temporal sola, para reactivar o restablecer. */
export const esquemaDeContrasenaTemporal = z.object({ contrasena: campoCon(reglaDeContrasena) });
export type DatosDeContrasenaTemporal = z.infer<typeof esquemaDeContrasenaTemporal>;
