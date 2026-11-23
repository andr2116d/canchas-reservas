/** Deja solo letras sin tilde y números de la primera palabra. */
function primeraPalabraSinTildes(texto: string): string {
  const [palabra = ''] = texto.trim().split(/\s+/);
  return palabra
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Sugiere lo que va antes de la @ del correo del personal: primer nombre y
 * primer apellido. Desde el segundo intento agrega el número, para resolver
 * repetidos (rosa.quispe, rosa.quispe2, rosa.quispe3…).
 */
export function sugerirUsuarioDeCorreo(
  nombres: string,
  apellidos: string,
  intento: number,
): string | undefined {
  const base = [nombres, apellidos]
    .map(primeraPalabraSinTildes)
    .filter(Boolean)
    .join('.');
  if (!base) return undefined;
  return intento > 1 ? `${base}${intento}` : base;
}
