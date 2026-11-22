import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { urlBaseDePruebas } from './url-base-de-pruebas';

async function crearBaseSiNoExiste(url: URL): Promise<void> {
  const nombre = url.pathname.replace(/^\//, '');
  const administracion = new URL(url);
  administracion.pathname = '/postgres';
  const cliente = new Client({ connectionString: administracion.toString() });
  await cliente.connect();
  try {
    const existe = await cliente.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [nombre],
    );
    if (existe.rowCount === 0) {
      await cliente.query(`CREATE DATABASE "${nombre.replace(/"/g, '')}"`);
    }
  } finally {
    await cliente.end();
  }
}

/** Antes de todas las pruebas: crea la base de pruebas y le aplica las migraciones. */
export default async function prepararBaseDePruebas(): Promise<void> {
  const url = urlBaseDePruebas();
  await crearBaseSiNoExiste(new URL(url));
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });
}
