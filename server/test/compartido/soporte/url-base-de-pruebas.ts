import 'dotenv/config';

/**
 * URL de la base exclusiva de las pruebas: la misma de DATABASE_URL con el
 * sufijo `_pruebas`, para no tocar nunca los datos de desarrollo.
 */
export function urlBaseDePruebas(): string {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const nombre = url.pathname.replace(/^\//, '');
  if (!nombre) throw new Error('DATABASE_URL no indica una base de datos.');
  url.pathname = nombre.endsWith('_pruebas') ? nombre : `${nombre}_pruebas`;
  return url.toString();
}
