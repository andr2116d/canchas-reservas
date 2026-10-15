import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

export const REPO = process.env.GITHUB_REPOSITORY ?? 'andr2116d/canchas-reservas';
export const RESPONSABLE = process.env.RESPONSABLE ?? 'andr2116d';

export function api(ruta, { paginar = false } = {}) {
  const args = ['api', ruta];
  if (paginar) args.push('--paginate', '--slurp');
  const salida = execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const datos = JSON.parse(salida);
  return paginar ? datos.flat() : datos;
}

export function resumen(titulo, errores, avisos = []) {
  const lineas = [`## ${titulo}`, ''];
  if (errores.length === 0) lineas.push('Todo en orden.', '');
  for (const e of errores) lineas.push(`- ❌ ${e}`);
  for (const a of avisos) lineas.push(`- ⚠️ ${a}`);
  const texto = lineas.join('\n') + '\n';
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, texto);
  for (const e of errores) console.log(`::error::${e}`);
  for (const a of avisos) console.log(`::warning::${a}`);
  if (errores.length === 0) console.log(`${titulo}: todo en orden`);
  process.exitCode = errores.length > 0 ? 1 : 0;
}
