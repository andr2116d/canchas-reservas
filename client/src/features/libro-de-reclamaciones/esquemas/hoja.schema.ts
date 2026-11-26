import { z } from "zod";
import { reglaDeMonto } from "@/compartido/formulario/regla-de-monto";
import {
  campoCon,
  reglaDeCorreo,
  reglasDeDatosPersonales,
  type Regla,
  TIPOS_DOCUMENTO,
  validarDocumento,
} from "@/compartido/formulario/reglas-de-datos-personales";
import type { DatosDeLaHoja } from "../servicios/libro";

export const LARGOS_DE_LA_HOJA = { domicilio: 200, descripcion: 200, detalle: 2000, pedido: 1000, representante: 160 } as const;

const obligatorio =
  (vacio: string, maximo: number, largo: string): Regla =>
  (valor) => {
    const limpio = valor.trim();
    if (limpio === "") return vacio;
    if (limpio.length > maximo) return largo;
  };

/** Celular de 9 dígitos o fijo con su código de ciudad; espacios y guiones no cuentan. */
export const reglaDeTelefono: Regla = (valor) => {
  const limpio = valor.replace(/[\s-]/g, "");
  if (limpio === "") return "Ingresa tu teléfono.";
  if (!/^\d{7,9}$/.test(limpio)) return "Ingresa un teléfono de 7 a 9 dígitos: celular o fijo con su código de ciudad.";
};

const reglas = reglasDeDatosPersonales("propia");
const revisarDocumento = validarDocumento("propia");
const opcionalHasta = (maximo: number, mensaje: string) => z.string().max(maximo, mensaje);

export const esquemaDeLaHoja = z
  .object({
    tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: reglas.tipoDocumento }),
    numeroDocumento: z.string(),
    nombres: campoCon(reglas.nombres),
    apellidos: campoCon(reglas.apellidos),
    domicilio: campoCon(obligatorio("Ingresa tu domicilio.", 200, "El domicilio no puede tener más de 200 caracteres.")),
    telefono: campoCon(reglaDeTelefono),
    correo: campoCon(reglaDeCorreo),
    esMenorDeEdad: z.boolean(),
    representanteNombre: z.string(),
    representanteDomicilio: z.string(),
    representanteTelefono: z.string(),
    representanteCorreo: z.string(),
    servicio: z.enum(["RESERVA_DE_CANCHA", "MATERIAL_ADICIONAL", "OTRO"], { error: "Elige qué contrataste." }),
    montoReclamado: z.string().superRefine((valor, contexto) => {
      const mensaje = valor.trim() === "" ? undefined : reglaDeMonto(valor);
      if (mensaje) contexto.addIssue({ code: "custom", message: mensaje });
    }),
    descripcionDelServicio: opcionalHasta(200, "La descripción no puede tener más de 200 caracteres."),
    tipo: z.enum(["RECLAMO", "QUEJA"], { error: "Elige si es un reclamo o una queja." }),
    detalle: campoCon(obligatorio("Cuéntanos qué pasó.", 2000, "El detalle no puede tener más de 2000 caracteres.")),
    pedido: campoCon(obligatorio("Dinos qué pides.", 1000, "El pedido no puede tener más de 1000 caracteres.")),
    medioDeRespuesta: z.enum(["CORREO", "CARTA"], { error: "Elige cómo quieres recibir la respuesta." }),
    conforme: z.boolean().refine((valor) => valor, "Confirma que tus datos son correctos para enviar la hoja."),
  })
  // `when`: estas reglas corren aunque falten campos de otros pasos, para revisar cada paso al avanzar.
  .superRefine(
    (hoja, contexto) => {
      if ((TIPOS_DOCUMENTO as readonly string[]).includes(hoja.tipoDocumento)) revisarDocumento(hoja, contexto);
    },
    { when: () => true },
  )
  .superRefine((hoja, contexto) => {
    if (!hoja.esMenorDeEdad) return;
    const faltan: [keyof typeof hoja, string | undefined][] = [
      ["representanteNombre", obligatorio("Ingresa el nombre de tu padre, madre o representante.", 160, "El nombre no puede tener más de 160 caracteres.")(hoja.representanteNombre)],
      ["representanteDomicilio", obligatorio("Ingresa su domicilio.", 200, "El domicilio no puede tener más de 200 caracteres.")(hoja.representanteDomicilio)],
      ["representanteTelefono", reglaDeTelefono(hoja.representanteTelefono)?.replace("tu teléfono", "su teléfono")],
      ["representanteCorreo", reglaDeCorreo(hoja.representanteCorreo)?.replace("tu correo", "su correo")],
    ];
    for (const [campo, mensaje] of faltan) if (mensaje) contexto.addIssue({ code: "custom", message: mensaje, path: [campo] });
  }, { when: () => true });

export type FormularioDeLaHoja = z.input<typeof esquemaDeLaHoja>;

/** Los tres pasos de la hoja y los campos que revisa cada uno antes de seguir. */
export const PASOS_DE_LA_HOJA = [
  {
    titulo: "Tus datos",
    campos: ["tipoDocumento", "numeroDocumento", "nombres", "apellidos", "domicilio", "telefono", "correo", "esMenorDeEdad", "representanteNombre", "representanteDomicilio", "representanteTelefono", "representanteCorreo"],
  },
  { titulo: "Qué contrataste", campos: ["servicio", "montoReclamado", "descripcionDelServicio"] },
  { titulo: "Tu reclamo", campos: ["tipo", "detalle", "pedido", "medioDeRespuesta", "conforme"] },
] as const satisfies { titulo: string; campos: (keyof FormularioDeLaHoja)[] }[];

/** El paso donde está un campo, para volver a él si el server lo rechaza. */
export function pasoDelCampo(campo: string): number {
  const indice = PASOS_DE_LA_HOJA.findIndex((paso) => (paso.campos as readonly string[]).includes(campo));
  return Math.max(indice, 0);
}

/** Valores de inicio; con sesión de jugador, los datos de su cuenta (menos el domicilio). */
export function hojaEnBlanco(cuenta?: Partial<Pick<FormularioDeLaHoja, "tipoDocumento" | "numeroDocumento" | "nombres" | "apellidos" | "telefono" | "correo">>): FormularioDeLaHoja {
  return {
    tipoDocumento: "DNI",
    numeroDocumento: "",
    nombres: "",
    apellidos: "",
    domicilio: "",
    telefono: "",
    correo: "",
    esMenorDeEdad: false,
    representanteNombre: "",
    representanteDomicilio: "",
    representanteTelefono: "",
    representanteCorreo: "",
    servicio: undefined as unknown as FormularioDeLaHoja["servicio"],
    montoReclamado: "",
    descripcionDelServicio: "",
    tipo: undefined as unknown as FormularioDeLaHoja["tipo"],
    detalle: "",
    pedido: "",
    medioDeRespuesta: undefined as unknown as FormularioDeLaHoja["medioDeRespuesta"],
    conforme: false,
    ...cuenta,
  };
}

/** Lo que se envía a la API: los datos del representante solo si es menor de edad. */
export function aDatosDeLaHoja(hoja: FormularioDeLaHoja): DatosDeLaHoja {
  const { representanteNombre, representanteDomicilio, representanteTelefono, representanteCorreo, ...conConfirmacion } = hoja;
  const resto: Partial<FormularioDeLaHoja> = { ...conConfirmacion };
  delete resto.conforme;
  return {
    ...resto,
    ...(hoja.esMenorDeEdad && { representanteNombre, representanteDomicilio, representanteTelefono, representanteCorreo }),
  } as DatosDeLaHoja;
}
