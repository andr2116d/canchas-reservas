import { EnMemoriaSesionRepository } from '../../../../test/sesiones/dobles/en-memoria-sesion.repository';
import { GeneradorTokenDePrueba } from '../../../../test/compartido/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { AbrirSesionUseCase } from './abrir-sesion.use-case';
import { OmitirCambioDeContrasenaUseCase } from './omitir-cambio-de-contrasena.use-case';
import { ValidarSesionUseCase } from './validar-sesion.use-case';

async function prepararSesionTemporal() {
  const reloj = new RelojDePrueba();
  const sesiones = new EnMemoriaSesionRepository({
    rol: 'RECEPCIONISTA',
    requiereCambiarContrasena: true,
  });
  const generador = new GeneradorTokenDePrueba();
  const { token } = await new AbrirSesionUseCase(
    sesiones,
    generador,
    reloj,
  ).ejecutar(7);
  const validar = new ValidarSesionUseCase(sesiones, generador, reloj);
  return { sesiones, token, validar };
}

describe('OmitirCambioDeContrasenaUseCase', () => {
  it('marca solo esa sesión para cambiar la contraseña más tarde', async () => {
    const { sesiones, token, validar } = await prepararSesionTemporal();
    const sesion = await validar.ejecutar(token);

    await new OmitirCambioDeContrasenaUseCase(sesiones).ejecutar(sesion!);

    await expect(validar.ejecutar(token)).resolves.toMatchObject({
      requiereCambiarContrasena: true,
      cambioOmitido: true,
    });
  });

  it('una sesión nueva vuelve a pedir el cambio', async () => {
    const { sesiones, validar } = await prepararSesionTemporal();

    const { token } = await new AbrirSesionUseCase(
      sesiones,
      new GeneradorTokenDePrueba(),
      new RelojDePrueba(),
    ).ejecutar(7);

    await expect(validar.ejecutar(token)).resolves.toMatchObject({
      cambioOmitido: false,
    });
  });
});
