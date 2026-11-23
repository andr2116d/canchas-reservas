import { randomBytes, randomInt } from 'node:crypto';

/** Correo y contraseña temporal únicos para un administrador de prueba. */
export function credencialesDePrueba(dominio: string): {
  correo: string;
  contrasena: string;
} {
  const sufijo = randomBytes(3).toString('hex');
  return {
    correo: `admin.prueba.${sufijo}@${dominio}`,
    contrasena: `Prueba${randomInt(1000, 10_000)}${randomBytes(2).toString('hex')}`,
  };
}

/** Las cuentas de prueba nunca se crean en producción. */
export function exigirEntornoDePrueba(entorno: string | undefined): void {
  if (entorno === 'production') {
    throw new Error('No se crean administradores de prueba en producción.');
  }
}
