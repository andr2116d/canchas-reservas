import { GeneradorTokenDePrueba } from '../../../../test/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { EnMemoriaSesionRepository } from '../../../../test/dobles/en-memoria-sesion.repository';
import { AbrirSesionUseCase } from './abrir-sesion.use-case';
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
  return { reloj, token, validar };
}

describe('ValidarSesionUseCase', () => {
  it('devuelve el usuario de una sesión vigente', async () => {
    const { token, validar } = await prepararSesionAbierta();

    await expect(validar.ejecutar(token)).resolves.toEqual({ usuarioId: 7 });
  });

  it('registra la actividad para que la sesión siga viva', async () => {
    const { token, validar, reloj } = await prepararSesionAbierta();

    reloj.avanzarMinutos(25);
    await validar.ejecutar(token);
    reloj.avanzarMinutos(25);

    await expect(validar.ejecutar(token)).resolves.toEqual({ usuarioId: 7 });
  });

  it('rechaza una sesión inactiva por 30 minutos', async () => {
    const { token, validar, reloj } = await prepararSesionAbierta();

    reloj.avanzarMinutos(30);

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
