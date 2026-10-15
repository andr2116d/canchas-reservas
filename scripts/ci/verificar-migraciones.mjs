import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const carpeta = 'server/prisma/migrations';
const sql = readdirSync(carpeta, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => readFileSync(join(carpeta, d.name, 'migration.sql'), 'utf8'))
  .join('\n');

// Índices escritos a mano en las migraciones (parciales o con expresiones) que Prisma no puede representar.
const manuales = new Set([...sql.matchAll(/CREATE UNIQUE INDEX\s+"?(\w+)"?/gi)].map((m) => m[1]));

const diff = execFileSync(
  'npx',
  ['prisma', 'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--script'],
  { cwd: 'server', encoding: 'utf8' },
);

const pendientes = diff
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('--'))
  .filter((l) => {
    const indice = l.match(/^DROP INDEX\s+"?(\w+)"?/i);
    return !(indice && manuales.has(indice[1]));
  });

if (pendientes.length > 0) {
  console.log('::error::schema.prisma tiene cambios que no están en ninguna migración. Corre npm run db:migrate y sube la carpeta nueva.');
  console.log(pendientes.join('\n'));
  process.exit(1);
}
console.log(`Migraciones al día (${manuales.size} índices manuales ignorados).`);
