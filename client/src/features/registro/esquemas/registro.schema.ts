import { z } from "zod";

export const TIPOS_DOCUMENTO = ["DNI", "CARNE_EXTRANJERIA"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

/** Largos que aceptan las reglas; los campos no dejan escribir más. */
export const LARGOS = {
  nombre: 80,
  dni: 8,
  carneMinimo: 9,
  carneMaximo: 12,
  celular: 9,
  dorsal: 2,
  correo: 254,
  contrasenaMinima: 8,
  contrasenaMaxima: 64,
} as const;

/** Cada regla devuelve qué corregir, o nada si el valor es válido. */
type Regla = (valor: string) => string | undefined;

// Formato de correo del estándar HTML (WHATWG), con al menos un punto en el dominio.
const FORMATO_CORREO =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const reglaDeNombre =
  (etiqueta: "nombres" | "apellidos"): Regla =>
  (valor) => {
    const limpio = valor.trim();
    if (limpio === "") return `Ingresa tus ${etiqueta}.`;
    if (limpio.length > LARGOS.nombre) {
      return `Tus ${etiqueta} no pueden tener más de 80 caracteres.`;
    }
  };

const REGLAS_DE_DOCUMENTO: Record<TipoDocumento, Regla> = {
  DNI: (numero) => {
    if (!/^\d+$/.test(numero)) return "El DNI solo debe contener números.";
    if (numero.length !== LARGOS.dni) return "El DNI debe tener 8 dígitos.";
  },
  CARNE_EXTRANJERIA: (numero) => {
    if (!/^[A-Z0-9]+$/i.test(numero)) {
      return "El carné de extranjería solo admite letras y números.";
    }
    if (numero.length < LARGOS.carneMinimo || numero.length > LARGOS.carneMaximo) {
      return "El carné de extranjería debe tener entre 9 y 12 caracteres.";
    }
  },
};

/** Fecha (AAAA-MM-DD) de hoy en Lima, para que la edad no dependa del huso del navegador. */
function hoyEnLima(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

function esFechaReal(fecha: string): boolean {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const calendario = new Date(Date.UTC(anio, mes - 1, dia));
  return calendario.getUTCMonth() === mes - 1 && calendario.getUTCDate() === dia;
}

const reglaDeFechaNacimiento: Regla = (valor) => {
  if (valor === "") return "Ingresa tu fecha de nacimiento.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !esFechaReal(valor)) {
    return "La fecha de nacimiento no es válida.";
  }
  const hoy = hoyEnLima();
  if (valor > hoy) return "La fecha de nacimiento no puede ser futura.";
  if (Number(valor.slice(0, 4)) < 1900) return "Revisa el año de tu fecha de nacimiento.";
  const anios = Number(hoy.slice(0, 4)) - Number(valor.slice(0, 4));
  const edad = hoy.slice(5) < valor.slice(5) ? anios - 1 : anios;
  if (edad < 18) return "Debes tener al menos 18 años para crear tu cuenta.";
};

const reglaDeDorsal: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return undefined;
  if (!/^\d+$/.test(limpio)) return "El dorsal solo debe contener números.";
  const numero = Number(limpio);
  if (numero < 1 || numero > 99) return "El dorsal debe estar entre 1 y 99.";
};

const reglaDeCelular: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa tu número de celular.";
  if (!/^\d+$/.test(limpio)) return "El celular solo debe contener números.";
  if (!limpio.startsWith("9")) return "El celular debe empezar con 9.";
  if (limpio.length !== LARGOS.celular) return "El celular debe tener 9 dígitos.";
};

const reglaDeCorreo: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa tu correo.";
  if (limpio.length > LARGOS.correo) return "El correo no puede tener más de 254 caracteres.";
  if (!FORMATO_CORREO.test(limpio)) return "El correo no tiene un formato válido.";
};

const reglaDeContrasena: Regla = (valor) => {
  if (valor === "") return "Ingresa una contraseña.";
  if (valor.length < LARGOS.contrasenaMinima) return "La contraseña debe tener al menos 8 caracteres.";
  if (valor.length > LARGOS.contrasenaMaxima) return "La contraseña no puede tener más de 64 caracteres.";
  if (!/\d/.test(valor)) return "La contraseña debe incluir al menos un número.";
};

/** Convierte una regla en un campo de texto de zod con su mensaje. */
function campoCon(regla: Regla) {
  return z.string().superRefine((valor, contexto) => {
    const mensaje = regla(valor);
    if (mensaje) contexto.addIssue({ code: "custom", message: mensaje });
  });
}

/**
 * Formato de cada dato del registro, validado mientras la persona escribe.
 * El server vuelve a validar todo: estas reglas solo guían a quien escribe.
 */
export const esquemaRegistro = z
  .object({
    nombres: campoCon(reglaDeNombre("nombres")),
    apellidos: campoCon(reglaDeNombre("apellidos")),
    fechaNacimiento: campoCon(reglaDeFechaNacimiento),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO, {
      error: "Elige tu tipo de documento.",
    }),
    numeroDocumento: z.string(),
    celular: campoCon(reglaDeCelular),
    correo: campoCon(reglaDeCorreo),
    contrasena: campoCon(reglaDeContrasena),
    dorsal: campoCon(reglaDeDorsal),
  })
  .superRefine(({ tipoDocumento, numeroDocumento }, contexto) => {
    const numero = numeroDocumento.trim();
    const mensaje =
      numero === ""
        ? "Ingresa tu número de documento."
        : REGLAS_DE_DOCUMENTO[tipoDocumento](numero);
    if (mensaje) {
      contexto.addIssue({ code: "custom", message: mensaje, path: ["numeroDocumento"] });
    }
  });

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
