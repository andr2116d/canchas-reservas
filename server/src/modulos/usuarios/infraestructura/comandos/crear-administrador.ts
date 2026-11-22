import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../app.module';
import { DominioError } from '../../../../compartido/dominio/dominio.error';
import { RegistrarPersonalUseCase } from '../../aplicacion/registrar-personal.use-case';

async function crearAdministrador(): Promise<void> {
  const [correo, nombres, apellidos] = process.argv.slice(2);
  const contrasena = process.env.CONTRASENA_TEMPORAL_ADMINISTRADOR;
  if (!correo || !nombres || !apellidos || !contrasena) {
    throw new Error(
      'Proporciona correo, nombres, apellidos y CONTRASENA_TEMPORAL_ADMINISTRADOR.',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    await app
      .get(RegistrarPersonalUseCase)
      .ejecutar({ correo, nombres, apellidos, contrasena }, 'ADMINISTRADOR');
    process.stdout.write('Cuenta de administrador creada.\n');
  } finally {
    await app.close();
  }
}

void crearAdministrador().catch((error: unknown) => {
  const mensaje =
    error instanceof DominioError
      ? Object.values(error.errores).join(' ')
      : 'Revisa los parámetros y la configuración de la base.';
  process.stderr.write(`No se pudo crear la cuenta. ${mensaje}\n`);
  process.exitCode = 1;
});
