import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../app.module';
import { DominioError } from '../../../../compartido/dominio/dominio.error';

/**
 * Levanta la app sin servidor HTTP, ejecuta la tarea y muestra su resultado.
 * Si falla, explica el motivo sin detalles internos y termina con error.
 */
export function ejecutarComando(
  tarea: (app: INestApplicationContext) => Promise<string>,
): void {
  const ejecucion = async () => {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
      abortOnError: false,
    });
    try {
      process.stdout.write(`${await tarea(app)}\n`);
    } finally {
      await app.close();
    }
  };
  void ejecucion().catch((error: unknown) => {
    const mensaje =
      error instanceof DominioError
        ? Object.values(error.errores).join(' ')
        : error instanceof Error && error.name === 'Error'
          ? error.message
          : 'Revisa los parámetros y la configuración de la base.';
    process.stderr.write(`No se pudo crear la cuenta. ${mensaje}\n`);
    process.exitCode = 1;
  });
}
