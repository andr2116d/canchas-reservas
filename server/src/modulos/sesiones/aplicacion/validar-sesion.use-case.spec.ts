import { GeneradorTokenDePrueba } from '../../../../test/compartido/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaSesionRepository } from '../../../../test/sesiones/dobles/en-memoria-sesion.repository';
import { AbrirSesionUseCase } from './abrir-sesion.use-case';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';
import { ValidarSesionUseCase } from './validar-sesion.use-case';

async function prepararSesionAbierta() {
  const reloj = new RelojDePrueba();
  const sesiones = new EnMemoriaSesionRepository();
  const generador = new GeneradorTokenDePrueba();
  const { token } = await new AbrirSesionUseCase(
    sesiones,
    generador,
    reloj,
  ).ejecutar(7);
  const validar = new ValidarSesionUseCase(sesiones, generador, reloj);
  return {
    reloj,
    token,
    validar,
    cerrar: new CerrarSesionUseCase(sesiones, generador),
  };
}

describe('ValidarSesionUseCase', () => {
  it('devuelve el usuario de una sesión vigente', async () => {
    const { token, validar } = await prepararSesionAbierta();

    await expect(validar.ejecutar(token)).resolves.toMatchObject({
      usuarioId: 7,
      rol: 'JUGADOR',
    });
  });

  it('registra la actividad para que la sesión siga viva', async () => {
    const { token, validar, reloj } = await prepararSesionAbierta();

    reloj.avanzarMinutos(10);
    await validar.ejecutar(token);
    reloj.avanzarMinutos(10);

    await expect(validar.ejecutar(token)).resolves.toMatchObject({
      usuarioId: 7,
    });
  });

  it('rechaza una sesión inactiva por 15 minutos', async () => {
    const { token, validar, reloj } = await prepararSesionAbierta();

    reloj.avanzarMinutos(15);

    await expect(validar.ejecutar(token)).resolves.toBeUndefined();
  });

  it('permite consultar la vigencia sin extenderla', async () => {
    const { token, validar, reloj } = await prepararSesionAbierta();
    reloj.avanzarMinutos(10);

    await expect(validar.ejecutar(token, () => false)).resolves.toBeDefined();
    reloj.avanzarMinutos(5);
    await expect(validar.ejecutar(token)).resolves.toBeUndefined();
  });

  it('rechaza el token después de revocarlo', async () => {
    const { token, validar, cerrar } = await prepararSesionAbierta();

    await cerrar.ejecutar(token);

    await expect(validar.ejecutar(token)).resolves.toBeUndefined();
  });

  it.each([
    ['un token desconocido', 'token-inventado'],
    ['un token vacío', ''],
    ['la ausencia de token', undefined],
  ])('rechaza %s', async (_, token) => {
    const { validar } = await prepararSesionAbierta();

    await expect(validar.ejecutar(token)).resolves.toBeUndefined();
  });
});
