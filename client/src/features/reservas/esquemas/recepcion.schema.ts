import { z } from "zod";
import { reglaDeMonto } from "@/compartido/formulario/regla-de-monto";
import { campoCon, camposDeDatosPersonales, reglaDeCorreo, reglasDeDatosPersonales, TIPOS_DOCUMENTO, validarDocumento } from "@/compartido/formulario/reglas-de-datos-personales";
import { enSoles } from "@/compartido/ui/textos-del-local";

// Versión de la política de privacidad informada en recepción.
export const VERSION_DEL_AVISO = "2026-11-24";

export const esquemaDeAlta = z.object({
  ...camposDeDatosPersonales("ajena"),
  correo: campoCon((correo) => correo.trim() ? reglaDeCorreo(correo) : undefined),
  versionDelAviso: campoCon((version) => version === VERSION_DEL_AVISO ? undefined : "Confirma que informaste el aviso de privacidad."),
}).superRefine(validarDocumento("ajena"));

export const esquemaDeBusqueda = z.object({
  por: z.enum(["documento", "celular"]),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO),
  numeroDocumento: z.string(),
  celular: z.string(),
}).superRefine((datos, contexto) => {
  if (datos.por === "documento") return validarDocumento("ajena")(datos, contexto);
  const mensaje = reglasDeDatosPersonales("ajena").celular(datos.celular);
  if (mensaje) contexto.addIssue({ code: "custom", path: ["celular"], message: mensaje });
});

export type DatosDeAlta = z.infer<typeof esquemaDeAlta>;
export type DatosDeBusqueda = z.infer<typeof esquemaDeBusqueda>;

export const METODOS_DE_COBRO = { EFECTIVO: "Efectivo", YAPE: "Yape", PLIN: "Plin" } as const;
export type MetodoDeCobro = keyof typeof METODOS_DE_COBRO;
export const aCentimos = (monto: string) => Math.round(Number(monto.replace(",", ".")) * 100);

export function esquemaDeCobro(minimo: string, maximo: string) {
  return z.object({
    cobrar: z.boolean(),
    monto: z.string(),
    metodo: z.enum(["", "EFECTIVO", "YAPE", "PLIN"]),
    numeroOperacion: z.string(),
  }).superRefine((datos, contexto) => {
    if (!datos.cobrar) return;
    const marcar = (campo: string, message: string) => contexto.addIssue({ code: "custom", path: [campo], message });
    const problema = /^0+(?:[.,]0{1,2})?$/.test(datos.monto.trim()) ? undefined : reglaDeMonto(datos.monto);
    const importe = aCentimos(datos.monto);
    if (problema) marcar("monto", problema);
    else if (importe < aCentimos(minimo)) marcar("monto", minimo === maximo ? `Falta cobrar ${enSoles(((aCentimos(minimo) - importe) / 100).toFixed(2))}.` : `El adelanto mínimo es ${enSoles(minimo)}.`);
    else if (importe > aCentimos(maximo)) marcar("monto", `Corrige el monto. El máximo es ${enSoles(maximo)}.`);
    if (!datos.metodo) marcar("metodo", "Elige el método de pago.");
    if (datos.metodo === "YAPE" || datos.metodo === "PLIN") {
      const numero = datos.numeroOperacion.trim();
      if (!numero) marcar("numeroOperacion", "Ingresa el número de operación.");
      else if (numero.length > 120) marcar("numeroOperacion", "Usa como máximo 120 caracteres.");
    }
  });
}

export type DatosDeCobro = z.infer<ReturnType<typeof esquemaDeCobro>>;

export function cobroParaEnviar({ cobrar, monto, metodo, numeroOperacion }: DatosDeCobro) {
  if (!cobrar || !metodo) return undefined;
  return { monto, metodo, ...(metodo !== "EFECTIVO" && { numeroOperacion }) };
}
