import { describe, expect, it } from "vitest";
import { fraseDelRegistro } from "./frase-del-registro";

describe("fraseDelRegistro", () => {
  it.each([
    { categoria: "TARIFAS", accion: "EDICION", sujeto: "Fútbol 7", verbo: "cambió la tarifa de", destacado: "Fútbol 7" },
    { categoria: "TARIFAS", accion: "ALTA", sujeto: "Fútbol 5", verbo: "definió la tarifa de", destacado: "Fútbol 5" },
    { categoria: "HORARIO", accion: "EDICION", sujeto: "Horario de atención", verbo: "cambió el horario de atención", destacado: null },
    { categoria: "CANCELACION", accion: "ALTA", sujeto: "Regla de cancelación", verbo: "definió la regla de cancelación", destacado: null },
    { categoria: "ADELANTO", accion: "EDICION", sujeto: "Adelanto mínimo", verbo: "cambió el adelanto mínimo", destacado: null },
    { categoria: "CUENTAS", accion: "RESTABLECIMIENTO_DE_CONTRASENA", sujeto: "Rosa Díaz", verbo: "restableció la contraseña de", destacado: "Rosa Díaz" },
    { categoria: "CANCHAS", accion: "ELIMINACION", sujeto: "Cancha 3", verbo: "eliminó la cancha", destacado: "Cancha 3" },
    { categoria: "MANTENIMIENTO", accion: "BLOQUEO", sujeto: "Cancha 2", verbo: "bloqueó por mantenimiento", destacado: "Cancha 2" },
    { categoria: "ADICIONALES", accion: "EDICION", sujeto: "Balón", verbo: "editó el adicional", destacado: "Balón" },
    { categoria: "CUENTAS", accion: "CAMBIO_DE_CORREO", sujeto: "Valeria León", verbo: "cambió su correo", destacado: null },
    { categoria: "ACCESOS", accion: "INICIO_DE_SESION", sujeto: null, verbo: "inició sesión", destacado: null },
    { categoria: "RECLAMOS", accion: "APERTURA", sujeto: "Hoja 000014-2026", verbo: "abrió la", destacado: "Hoja 000014-2026" },
    { categoria: "RECLAMOS", accion: "CLASIFICACION", sujeto: "Hoja 000014-2026", verbo: "clasificó la", destacado: "Hoja 000014-2026" },
    { categoria: "RECLAMOS", accion: "CAMBIO_DE_TIPO", sujeto: "Hoja 000014-2026", verbo: "pasó a reclamo la", destacado: "Hoja 000014-2026" },
    { categoria: "RECLAMOS", accion: "RESPUESTA", sujeto: "Hoja 000014-2026", verbo: "respondió la", destacado: "Hoja 000014-2026" },
    { categoria: "RESERVAS", accion: "SEPARACION", sujeto: "Reserva 7K3Q9X", verbo: "separó la", destacado: "Reserva 7K3Q9X" },
    { categoria: "RESERVAS", accion: "EXPIRACION", sujeto: "Reserva 7K3Q9X", verbo: "dio por vencida la", destacado: "Reserva 7K3Q9X" },
    { categoria: "PLAZO_DE_PAGO", accion: "ALTA", sujeto: "Plazo para pagar el adelanto", verbo: "definió el plazo para pagar el adelanto", destacado: null },
    { categoria: "PLAZO_DE_PAGO", accion: "EDICION", sujeto: "Plazo para pagar el adelanto", verbo: "cambió el plazo para pagar el adelanto", destacado: null },
  ] as const)("$categoria · $accion", ({ categoria, accion, sujeto, verbo, destacado }) => {
    expect(fraseDelRegistro({ categoria, accion, sujeto })).toEqual({ verbo, sujeto: destacado });
  });
});
