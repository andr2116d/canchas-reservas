import type { Accion, Categoria, Registro } from "../servicios/historial";

type Verbos = Partial<Record<Accion, string>>;

const CON_SUJETO: Partial<Record<Categoria, Verbos>> = {
  CUENTAS: {
    ALTA: "creó la cuenta de",
    EDICION: "editó la cuenta de",
    DESACTIVACION: "desactivó la cuenta de",
    REACTIVACION: "reactivó la cuenta de",
    RESTABLECIMIENTO_DE_CONTRASENA: "restableció la contraseña de",
  },
  TARIFAS: { ALTA: "definió la tarifa de", EDICION: "cambió la tarifa de" },
  CANCHAS: {
    ALTA: "creó la cancha",
    EDICION: "editó la cancha",
    DESACTIVACION: "desactivó la cancha",
    REACTIVACION: "reactivó la cancha",
    ELIMINACION: "eliminó la cancha",
  },
  MANTENIMIENTO: {
    BLOQUEO: "bloqueó por mantenimiento",
    LIBERACION_DE_BLOQUEO: "liberó antes el mantenimiento de",
    RETIRO_DE_BLOQUEO: "quitó un bloqueo de",
  },
  ADICIONALES: {
    ALTA: "agregó el adicional",
    EDICION: "editó el adicional",
    DESACTIVACION: "desactivó el adicional",
    REACTIVACION: "reactivó el adicional",
    ELIMINACION: "eliminó el adicional",
  },
  RECLAMOS: {
    APERTURA: "abrió la",
    CLASIFICACION: "clasificó la",
    CAMBIO_DE_TIPO: "pasó a reclamo la",
    RESPUESTA: "respondió la",
  },
  RESERVAS: { SEPARACION: "separó la" },
};

/** Lo que no tiene un sujeto propio: la frase ya dice qué se cambió. */
const SIN_SUJETO: Partial<Record<Categoria, Verbos>> = {
  HORARIO: { ALTA: "definió el horario de atención", EDICION: "cambió el horario de atención" },
  CANCELACION: { ALTA: "definió la regla de cancelación", EDICION: "cambió la regla de cancelación" },
  ADELANTO: { ALTA: "definió el adelanto mínimo", EDICION: "cambió el adelanto mínimo" },
  ACCESOS: { INICIO_DE_SESION: "inició sesión" },
  CUENTAS: {
    CONFIRMACION_DE_DATOS: "confirmó sus datos",
    EDICION_PROPIA: "corrigió sus datos",
    CAMBIO_DE_CONTRASENA: "cambió su contraseña",
    CAMBIO_DE_CORREO: "cambió su correo",
    CAMBIO_DE_DOCUMENTO: "cambió su tipo de documento",
  },
};

/** Qué hizo la persona, en palabras, y qué resaltar: «cambió la tarifa de» **Fútbol 7**. */
export function fraseDelRegistro({ categoria, accion, sujeto }: Pick<Registro, "categoria" | "accion" | "sujeto">): { verbo: string; sujeto: string | null } {
  const sinSujeto = SIN_SUJETO[categoria]?.[accion];
  if (sinSujeto) return { verbo: sinSujeto, sujeto: null };
  return { verbo: CON_SUJETO[categoria]?.[accion] ?? "hizo un cambio en", sujeto };
}
