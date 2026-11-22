export const INICIO_DEL_JUGADOR = "/inicio";

/**
 * A dónde llevar a la persona después de registrarse: al flujo del que vino
 * (por ejemplo, la reserva de una cancha) o a su inicio. Solo acepta rutas
 * internas, para que un enlace no pueda redirigir a otro sitio.
 */
export function destinoTrasRegistro(siguiente: string | undefined): string {
  if (!siguiente) return INICIO_DEL_JUGADOR;
  const esRutaInterna =
    siguiente.startsWith("/") && !siguiente.startsWith("//") && !siguiente.startsWith("/\\");
  return esRutaInterna ? siguiente : INICIO_DEL_JUGADOR;
}
