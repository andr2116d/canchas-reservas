import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { DatoEditable } from "@/compartido/cuenta/cuenta.servidor";

/** Guarda los datos de contacto que la persona puede cambiar de su cuenta. */
export async function actualizarMiCuenta(cambios: Partial<Record<DatoEditable, string>>): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson("/api/cuenta", "PATCH", cambios));
}

/** Cambia la contraseña con la actual; la API renueva la sesión y cierra las demás. */
export async function cambiarMiContrasena(actual: string, contrasena: string): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson("/api/cuenta/contrasena", "PATCH", { actual, contrasena }));
}

/** Primer ingreso del personal: completa o confirma sus datos. */
export async function completarMisDatos(datos: Record<string, string | undefined>): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson("/api/cuenta/datos", "POST", datos));
}

/** El cambio único de DNI a carné de extranjería, o al revés, tras leer el aviso. */
export async function cambiarMiTipoDeDocumento(tipoDocumento: string, numeroDocumento: string): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(
    await enviarJson("/api/cuenta/documento", "PATCH", { tipoDocumento, numeroDocumento, aceptaAviso: true }),
  );
}

/** Cierra todas las sesiones de la cuenta menos esta. */
export async function cerrarMisOtrasSesiones(): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson("/api/cuenta/sesiones/otras", "DELETE"));
}
