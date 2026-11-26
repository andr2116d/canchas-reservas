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
export type Regla = (valor: string) => string | undefined;

/**
 * Quién llena el formulario: la persona con sus propios datos (`propia`) o
 * alguien del personal con los datos de otra persona (`ajena`).
 */
export type Voz = "propia" | "ajena";

const MENSAJES = {
  propia: {
    nombres: "Ingresa tus nombres.",
    apellidos: "Ingresa tus apellidos.",
    nombresLargos: "Tus nombres no pueden tener más de 80 caracteres.",
    apellidosLargos: "Tus apellidos no pueden tener más de 80 caracteres.",
    fecha: "Ingresa tu fecha de nacimiento.",
    anio: "Revisa el año de tu fecha de nacimiento.",
    menor: "Debes tener al menos 18 años para crear tu cuenta.",
    tipoDocumento: "Elige tu tipo de documento.",
    documento: "Ingresa tu número de documento.",
    celular: "Ingresa tu número de celular.",
  },
  ajena: {
    nombres: "Ingresa los nombres.",
    apellidos: "Ingresa los apellidos.",
    nombresLargos: "Los nombres no pueden tener más de 80 caracteres.",
    apellidosLargos: "Los apellidos no pueden tener más de 80 caracteres.",
    fecha: "Ingresa la fecha de nacimiento.",
    anio: "Revisa el año de la fecha de nacimiento.",
    menor: "Debe tener al menos 18 años.",
    tipoDocumento: "Elige el tipo de documento.",
    documento: "Ingresa el número de documento.",
    celular: "Ingresa el número de celular.",
  },
} satisfies Record<Voz, Record<string, string>>;

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

function edadCumplida(fecha: string, hoy: string): number {
  const anios = Number(hoy.slice(0, 4)) - Number(fecha.slice(0, 4));
  return hoy.slice(5) < fecha.slice(5) ? anios - 1 : anios;
}

// Formato de correo del estándar HTML (WHATWG), con al menos un punto en el dominio.
const FORMATO_CORREO =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Dorsal opcional del jugador, del 1 al 99. */
export const reglaDeDorsal: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return undefined;
  if (!/^\d+$/.test(limpio)) return "El dorsal solo debe contener números.";
  const numero = Number(limpio);
  if (numero < 1 || numero > 99) return "El dorsal debe estar entre 1 y 99.";
};

/** Correo de quien escribe sus propios datos. */
export const reglaDeCorreo: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa tu correo.";
  if (limpio.length > LARGOS.correo) return "El correo no puede tener más de 254 caracteres.";
  if (!FORMATO_CORREO.test(limpio)) return "El correo no tiene un formato válido.";
};

/** Regla de la contraseña, igual para todas las cuentas. */
export const reglaDeContrasena: Regla = (valor) => {
  if (valor === "") return "Ingresa una contraseña.";
  if (valor.length < LARGOS.contrasenaMinima) return "La contraseña debe tener al menos 8 caracteres.";
  if (valor.length > LARGOS.contrasenaMaxima) return "La contraseña no puede tener más de 64 caracteres.";
  if (!/\d/.test(valor)) return "La contraseña debe incluir al menos un número.";
};

/** Reglas de los datos personales comunes a jugadores y personal. */
export function reglasDeDatosPersonales(voz: Voz) {
  const mensajes = MENSAJES[voz];
  const reglaDeNombre =
    (campo: "nombres" | "apellidos"): Regla =>
    (valor) => {
      const limpio = valor.trim();
      if (limpio === "") return mensajes[campo];
      if (limpio.length > LARGOS.nombre) return mensajes[`${campo}Largos`];
    };

  return {
    nombres: reglaDeNombre("nombres"),
    apellidos: reglaDeNombre("apellidos"),
    fechaNacimiento: ((valor) => {
      if (valor === "") return mensajes.fecha;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !esFechaReal(valor)) {
        return "La fecha de nacimiento no es válida.";
      }
      const hoy = hoyEnLima();
      if (valor > hoy) return "La fecha de nacimiento no puede ser futura.";
      if (Number(valor.slice(0, 4)) < 1900) return mensajes.anio;
      if (edadCumplida(valor, hoy) < 18) return mensajes.menor;
    }) satisfies Regla,
    celular: ((valor) => {
      const limpio = valor.trim();
      if (limpio === "") return mensajes.celular;
      if (!/^\d+$/.test(limpio)) return "El celular solo debe contener números.";
      if (!limpio.startsWith("9")) return "El celular debe empezar con 9.";
      if (limpio.length !== LARGOS.celular) return "El celular debe tener 9 dígitos.";
    }) satisfies Regla,
    tipoDocumento: mensajes.tipoDocumento,
    documento(tipo: TipoDocumento, numero: string): string | undefined {
      const limpio = numero.trim();
      return limpio === "" ? mensajes.documento : REGLAS_DE_DOCUMENTO[tipo](limpio);
    },
  };
}

/** Convierte una regla en un campo de texto de zod con su mensaje. */
export function campoCon(regla: Regla) {
  return z.string().superRefine((valor, contexto) => {
    const mensaje = regla(valor);
    if (mensaje) contexto.addIssue({ code: "custom", message: mensaje });
  });
}

/** Campos de zod de los datos personales, con el tipo y el número de documento validados juntos. */
export function camposDeDatosPersonales(voz: Voz) {
  const reglas = reglasDeDatosPersonales(voz);
  return {
    nombres: campoCon(reglas.nombres),
    apellidos: campoCon(reglas.apellidos),
    fechaNacimiento: campoCon(reglas.fechaNacimiento),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: reglas.tipoDocumento }),
    numeroDocumento: z.string(),
    celular: campoCon(reglas.celular),
  };
}

/** Valida el número contra el tipo de documento elegido y marca el error en `numeroDocumento`. */
export function validarDocumento(voz: Voz) {
  const reglas = reglasDeDatosPersonales(voz);
  return (
    { tipoDocumento, numeroDocumento }: { tipoDocumento: TipoDocumento; numeroDocumento: string },
    contexto: z.RefinementCtx,
  ) => {
    const mensaje = reglas.documento(tipoDocumento, numeroDocumento);
    if (mensaje) contexto.addIssue({ code: "custom", message: mensaje, path: ["numeroDocumento"] });
  };
}
