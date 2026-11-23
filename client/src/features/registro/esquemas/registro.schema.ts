import { z } from "zod";
import {
  camposDeDatosPersonales,
  campoCon,
  reglaDeContrasena,
  reglaDeCorreo,
  reglaDeDorsal,
  validarDocumento,
} from "@/compartido/formulario/reglas-de-datos-personales";
import { VERSION_LEGAL_DEL_REGISTRO } from "../servicios/version-legal-del-registro";

/**
 * Formato de cada dato del registro, validado mientras la persona escribe.
 * El server vuelve a validar todo: estas reglas solo guían a quien escribe.
 */
export const esquemaRegistro = z
  .object({
    ...camposDeDatosPersonales("propia"),
    correo: campoCon(reglaDeCorreo),
    contrasena: campoCon(reglaDeContrasena),
    dorsal: campoCon(reglaDeDorsal),
    versionLegalAceptada: campoCon((version) =>
      version === VERSION_LEGAL_DEL_REGISTRO
        ? undefined
        : "Acepta los términos y la política de privacidad para crear tu cuenta.",
    ),
  })
  .superRefine(validarDocumento("propia"));

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
