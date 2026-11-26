import { RegistrarPersonalUseCase } from '../../aplicacion/registrar-personal.use-case';
import { ejecutarComando } from './ejecutar-comando';

ejecutarComando(async (app) => {
  const [correo, nombres, apellidos] = process.argv.slice(2);
  const contrasena = process.env.CONTRASENA_TEMPORAL_ADMINISTRADOR;
  if (!correo || !nombres || !apellidos || !contrasena) {
    throw new Error(
      'Proporciona correo, nombres, apellidos y CONTRASENA_TEMPORAL_ADMINISTRADOR.',
    );
  }
  await app
    .get(RegistrarPersonalUseCase)
    .ejecutar({ correo, nombres, apellidos, contrasena }, 'ADMINISTRADOR');
  return 'Cuenta de administrador creada. La contraseña temporal vence en 7 días.';
});
