import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

const verde = (t) => `\x1b[32m${t}\x1b[0m`;
const rojo = (t) => `\x1b[31m${t}\x1b[0m`;
const negrita = (t) => `\x1b[1m${t}\x1b[0m`;

function paso(texto) {
  console.log(`\n${negrita('>')} ${texto}`);
}

function fallar(mensaje) {
  console.error(`\n${rojo('No se pudo completar el setup.')}\n${mensaje}\n`);
  process.exit(1);
}

function ejecutar(comando, mensajeError) {
  const resultado = spawnSync(comando, { stdio: 'inherit', shell: true });
  if (resultado.status !== 0) fallar(mensajeError);
}

paso('Revisando Node.js');
const versionNode = Number(process.versions.node.split('.')[0]);
if (versionNode < 24) {
  fallar(`Tienes Node ${process.versions.node}. Instala Node 24 o superior y vuelve a ejecutar npm run setup.`);
}
console.log(verde(`Node ${process.versions.node}`));

paso('Revisando Docker');
const docker = spawnSync('docker info', { stdio: 'ignore', shell: true });
if (docker.status !== 0) {
  fallar('Docker no esta abierto. Abre Docker Desktop, espera a que diga que esta corriendo y vuelve a ejecutar npm run setup.');
}
console.log(verde('Docker esta corriendo'));

paso('Preparando variables de entorno');
const envs = [
  ['server/.env.example', 'server/.env'],
  ['client/.env.example', 'client/.env.local'],
];
for (const [origen, destino] of envs) {
  if (existsSync(destino)) {
    console.log(`${destino} ya existe, se mantiene`);
  } else {
    copyFileSync(origen, destino);
    console.log(verde(`${destino} creado`));
  }
}

paso('Levantando Postgres');
ejecutar(
  'docker compose --env-file server/.env up -d --wait',
  'Postgres no pudo arrancar. Si dice que el puerto 5432 esta en uso, revisa la seccion "Si algo falla" de la guia de configuracion.',
);

paso('Generando el cliente de Prisma');
ejecutar('npm run db:generate -w server', 'Fallo prisma generate. Ejecuta npm install y vuelve a intentar.');

paso('Creando las tablas');
ejecutar('npm run db:deploy -w server', 'Fallaron las migraciones. Prueba con npm run db:reset.');

paso('Cargando datos de demo');
ejecutar('npm run db:seed -w server', 'Fallo el seed. Prueba con npm run db:reset.');

console.log(`\n${verde(negrita('Todo listo.'))} Ahora ejecuta: ${negrita('npm run dev')}`);
console.log('  Aplicacion  http://localhost:3000');
console.log('  API         http://localhost:3001/api/salud\n');
