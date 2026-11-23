import { z } from "zod";
import {
  camposDeDatosPersonales,
  campoCon,
  LARGOS,
  reglaDeContrasena,
  validarDocumento,
  type Regla,
} from "@/compartido/formulario/reglas-de-datos-personales";
import { VERSION_LEGAL_DEL_REGISTRO } from "../servicios/version-legal-del-registro";

// Formato de correo del estándar HTML (WHATWG), con al menos un punto en el dominio.
const FORMATO_CORREO =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const reglaDeDorsal: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return undefined;
  if (!/^\d+$/.test(limpio)) return "El dorsal solo debe contener números.";
  const numero = Number(limpio);
  if (numero < 1 || numero > 99) return "El dorsal debe estar entre 1 y 99.";
};

const reglaDeCorreo: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa tu correo.";
  if (limpio.length > LARGOS.correo) return "El correo no puede tener más de 254 caracteres.";
  if (!FORMATO_CORREO.test(limpio)) return "El correo no tiene un formato válido.";
};

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
