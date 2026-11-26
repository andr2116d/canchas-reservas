import { RegistrarPersonalUseCase } from '../../aplicacion/registrar-personal.use-case';
import { ReglasDeCorreo } from '../../dominio/reglas-de-correo';
import {
  credencialesDePrueba,
  exigirEntornoDePrueba,
} from './administrador-de-prueba';
import { ejecutarComando } from './ejecutar-comando';

/** Crea un administrador para probar la app en local e imprime sus credenciales. */
ejecutarComando(async (app) => {
  exigirEntornoDePrueba(process.env.NODE_ENV);
  const { dominioCorporativo } = app.get(ReglasDeCorreo);
  const { correo, contrasena } = credencialesDePrueba(dominioCorporativo);
  await app
    .get(RegistrarPersonalUseCase)
    .ejecutar(
      { correo, nombres: 'Administración', apellidos: 'De Prueba', contrasena },
      'ADMINISTRADOR',
    );
  return [
    'Administrador de prueba creado.',
    `Correo: ${correo}`,
    `Contraseña temporal: ${contrasena}`,
    'Vence en 7 días. Al entrar se te pedirá cambiarla.',
  ].join('\n');
});
