import { z } from "zod";
import { reglaDeUsuarioDeCorreo as reglaDeUsuarioDeCorreoInstitucional } from "@/compartido/formulario/regla-de-usuario-de-correo";
import {
  camposDeDatosPersonales,
  campoCon,
  reglaDeContrasena,
  validarDocumento,
} from "@/compartido/formulario/reglas-de-datos-personales";

export { LARGO_DEL_USUARIO_DE_CORREO } from "@/compartido/formulario/regla-de-usuario-de-correo";

const reglaDeUsuarioDeCorreo = reglaDeUsuarioDeCorreoInstitucional("Escribe el correo o genéralo con sus nombres.");

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
