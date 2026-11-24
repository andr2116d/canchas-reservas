import { z } from "zod";
import { camposDeDatosPersonales, validarDocumento } from "@/compartido/formulario/reglas-de-datos-personales";

const campos = camposDeDatosPersonales("propia");

const base = z.object({
  nombres: campos.nombres,
  apellidos: campos.apellidos,
  fechaNacimiento: campos.fechaNacimiento,
  celular: campos.celular,
});

/** Datos del primer ingreso cuando la cuenta ya tiene documento: ese no se toca. */
export const esquemaDeDatosConfirmados = base;

/** Datos del primer ingreso cuando aún falta el documento, como en el administrador. */
export const esquemaDeDatosCompletos = base
  .extend({ tipoDocumento: campos.tipoDocumento, numeroDocumento: campos.numeroDocumento })
  .superRefine(validarDocumento("propia"));

export type DatosPropios = z.infer<typeof base> & { tipoDocumento?: "DNI" | "CARNE_EXTRANJERIA"; numeroDocumento?: string };
