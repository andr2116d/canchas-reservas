export const CONFIGURACION = Symbol('CONFIGURACION');

/** Configuración del server, leída y validada una sola vez al arrancar. */
export interface Configuracion {
  puerto: number;
  urlBaseDeDatos: string;
  claveCifrado: Buffer;
  claveHash: Buffer;
  /** La cookie de sesión exige HTTPS salvo en desarrollo y pruebas. */
  cookieSegura: boolean;
  /** Proxies delante del server (Next en local, balanceador y Next en AWS) para leer la IP real. */
  saltosDeProxy: number;
  /** Registros permitidos por hora desde una misma IP. */
  limiteDeRegistrosPorHora: number;
  /** Dominio del correo del personal; los jugadores no pueden usarlo. */
  dominioCorporativo: string;
}

type Entorno = Record<string, string | undefined>;

const ENTORNOS_SIN_HTTPS = ['development', 'test'];

function exigir(entorno: Entorno, variable: string): string {
  const valor = entorno[variable];
  if (!valor) throw new Error(`Falta la variable de entorno ${variable}.`);
  return valor;
}

function leerClave(entorno: Entorno, variable: string): Buffer {
  const clave = Buffer.from(exigir(entorno, variable), 'base64');
  if (clave.length !== 32) {
    throw new Error(`${variable} debe ser de 32 bytes en base64.`);
  }
  return clave;
}

function leerEntero(entorno: Entorno, variable: string, porDefecto: number) {
  const valor = entorno[variable];
  if (valor === undefined || valor === '') return porDefecto;
  if (!/^\d+$/.test(valor)) {
    throw new Error(`${variable} debe ser un número entero.`);
  }
  return Number(valor);
}

/** Registros por hora desde una IP; 10 si no se configura. */
export function leerLimiteDeRegistros(entorno: Entorno): number {
  return leerEntero(entorno, 'LIMITE_REGISTROS_POR_HORA', 10);
}

const DOMINIO_CORPORATIVO_POR_DEFECTO = 'laprevia.pe';

/** Peticiones a la API permitidas por minuto desde una IP; 100 si no se configura. */
export function leerLimiteGeneral(entorno: Entorno): number {
  return leerEntero(entorno, 'LIMITE_GENERAL_POR_MINUTO', 100);
}

/** Inicios de sesión permitidos desde una IP cada 15 minutos; 20 si no se configura. */
export function leerLimiteDeInicios(entorno: Entorno): number {
  return leerEntero(entorno, 'LIMITE_INICIOS_POR_IP', 20);
}

function leerDominioCorporativo(entorno: Entorno): string {
  const dominio = entorno.DOMINIO_CORPORATIVO?.trim().toLowerCase();
  if (!dominio) return DOMINIO_CORPORATIVO_POR_DEFECTO;
  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      dominio,
    )
  ) {
    throw new Error(
      'DOMINIO_CORPORATIVO debe contener un dominio de correo válido.',
    );
  }
  return dominio;
}

/** Lee las variables de entorno y falla con un mensaje claro si falta alguna. */
export function leerConfiguracion(entorno: Entorno): Configuracion {
  return {
    puerto: leerEntero(entorno, 'PORT', 3001),
    urlBaseDeDatos: exigir(entorno, 'DATABASE_URL'),
    claveCifrado: leerClave(entorno, 'CLAVE_CIFRADO'),
    claveHash: leerClave(entorno, 'CLAVE_HASH'),
    cookieSegura: !ENTORNOS_SIN_HTTPS.includes(entorno.NODE_ENV ?? ''),
    saltosDeProxy: leerEntero(entorno, 'SALTOS_PROXY', 1),
    limiteDeRegistrosPorHora: leerLimiteDeRegistros(entorno),
    dominioCorporativo: leerDominioCorporativo(entorno),
  };
}
