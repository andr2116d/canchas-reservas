import { GeneradorTokenDePrueba } from '../../../../test/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { EnMemoriaSesionRepository } from '../infraestructura/persistencia/en-memoria-sesion.repository';
import { AbrirSesionUseCase } from './abrir-sesion.use-case';

function prepararApertura() {
  const sesiones = new EnMemoriaSesionRepository();
  const abrir = new AbrirSesionUseCase(
    sesiones,
    new GeneradorTokenDePrueba(),
    new RelojDePrueba(),
  );
  return { sesiones, abrir };
}

describe('AbrirSesionUseCase', () => {
  it('entrega el token y guarda solo su hash', async () => {
    const { abrir, sesiones } = prepararApertura();

    const abierta = await abrir.ejecutar(7);

    expect(abierta.token).toBe('token-1');
    const [guardada] = sesiones.todas();
    expect(guardada.tokenHash).toBe('hash(token-1)');
    expect(guardada.usuarioId).toBe(7);
  });

  it('informa cuándo vence, para fijar la vida de la cookie', async () => {
    const { abrir } = prepararApertura();

    const abierta = await abrir.ejecutar(7);

    expect(abierta.expiraEn).toEqual(new Date('2026-11-22T18:00:00.000Z'));
  });
});
