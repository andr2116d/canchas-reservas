import { api, REPO, resumen } from './github.mjs';

const numero = process.env.PR_NUMERO ?? process.argv[2];
const pr = api(`repos/${REPO}/pulls/${numero}`);
const archivos = api(`repos/${REPO}/pulls/${numero}/files?per_page=100`, { paginar: true });

const errores = [];
const avisos = [];
const base = pr.base.ref;
const rama = pr.head.ref;

if (pr.labels.some((l) => l.name === 'bloqueado')) {
  errores.push('El PR tiene la etiqueta "bloqueado". Quítala cuando esté listo para mergear.');
}

if (base === 'dev') {
  if (!/^(feature|fix)-[a-z0-9]+(-[a-z0-9]+)*$/.test(rama) && !rama.startsWith('dependabot/')) {
    errores.push(`La rama "${rama}" no sigue el formato feature-<nombre> (minúsculas, sin tildes).`);
  }
} else if (base === 'main') {
  if (rama !== 'dev' && !/^hotfix-[a-z0-9-]+$/.test(rama)) {
    errores.push('A main solo llegan PRs desde dev o desde una rama hotfix-<nombre>.');
  }
} else {
  errores.push(`Los PRs van a dev, no a "${base}".`);
}

const PROHIBIDOS = [
  [/(^|\/)\.env(\.[^/]*)?$/, 'archivos .env (solo se sube .env.example)'],
  [/(^|\/)(AGENTS|CLAUDE|GEMINI)\.md$/, 'archivos de agentes de IA'],
  [/(^|\/)\.(claude|codex|cursor|opencode)\//, 'carpetas de agentes de IA'],
  [/(^|\/)(opencode\.json|\.mcp\.json|copilot-instructions\.md)$/, 'configuración de agentes de IA'],
  [/(^|\/)(dist|\.next|coverage|node_modules)\//, 'carpetas generadas'],
  [/^server\/src\/generated\//, 'el cliente generado de Prisma'],
  [/\.tsbuildinfo$/, 'archivos .tsbuildinfo'],
  [/(^|\/)(pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/, 'lockfiles de otro gestor (solo npm)'],
];

const nombres = archivos.map((a) => a.filename);
for (const archivo of archivos) {
  if (archivo.status === 'removed') continue;
  if (archivo.filename.endsWith('.env.example')) continue;
  for (const [patron, motivo] of PROHIBIDOS) {
    if (patron.test(archivo.filename)) errores.push(`No se sube ${motivo}: ${archivo.filename}`);
  }
}

const VERSION = /^[+-]\s*"[^"]+":\s*"(\^|~|>=?)?\d/m;
const cambiaDependencias = archivos.some(
  (a) => /(^|\/)package\.json$/.test(a.filename) && VERSION.test(a.patch ?? ''),
);
if (cambiaDependencias && !nombres.includes('package-lock.json')) {
  errores.push('Cambiaste dependencias en un package.json pero no subiste package-lock.json. Usa npm install y sube el lock.');
}

for (const archivo of archivos) {
  if (/^server\/prisma\/migrations\/.+\/migration\.sql$/.test(archivo.filename) && archivo.status !== 'added') {
    errores.push(`Las migraciones ya mergeadas no se editan ni se borran: ${archivo.filename}. Crea una migración nueva.`);
  }
}

const cambiaSchema = nombres.includes('server/prisma/schema.prisma');
const agregaMigracion = archivos.some(
  (a) => a.status === 'added' && /^server\/prisma\/migrations\/.+\/migration\.sql$/.test(a.filename),
);
if (cambiaSchema && !agregaMigracion) {
  errores.push('Cambiaste schema.prisma sin una migración nueva. Corre npm run db:migrate y sube la carpeta generada.');
}

const lineas = archivos
  .filter((a) => a.filename !== 'package-lock.json')
  .reduce((total, a) => total + a.additions + a.deletions, 0);
if (lineas > 800) {
  avisos.push(`El PR cambia ${lineas} líneas. Mientras más chico, más fácil de revisar: considera partirlo.`);
}

if (!pr.body || pr.body.trim().length < 20) {
  avisos.push('El PR no tiene descripción. Llena la plantilla: qué cambia y cómo probarlo.');
}

resumen(`Reglas del PR #${numero}`, errores, avisos);
