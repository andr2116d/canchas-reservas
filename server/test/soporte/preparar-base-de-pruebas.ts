import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { urlBaseDePruebas } from './url-base-de-pruebas';

/** Borra y vuelve a crear la base de pruebas: cada corrida empieza vacía. */
async function recrearBase(url: URL): Promise<void> {
  const nombre = url.pathname.replace(/^\//, '').replace(/"/g, '');
  if (!nombre.endsWith('_pruebas')) {
    throw new Error(`Solo se recrea una base de pruebas, no "${nombre}".`);
  }
  const administracion = new URL(url);
  administracion.pathname = '/postgres';
  const cliente = new Client({ connectionString: administracion.toString() });
  await cliente.connect();
  try {
    await cliente.query(`DROP DATABASE IF EXISTS "${nombre}" WITH (FORCE)`);
    await cliente.query(`CREATE DATABASE "${nombre}"`);
  } finally {
    await cliente.end();
  }
}

/**
 * Antes de todas las pruebas: recrea la base de pruebas y le aplica todas las
 * migraciones desde cero, lo que además comprueba que aplican sobre una base vacía.
 */
export default async function prepararBaseDePruebas(): Promise<void> {
  const url = urlBaseDePruebas();
  await recrearBase(new URL(url));
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });
}
