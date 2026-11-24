import { EnMemoriaSesionRepository } from '../../../../test/sesiones/dobles/en-memoria-sesion.repository';
import { GeneradorTokenDePrueba } from '../../../../test/compartido/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  LimiteExcedidoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import {
  AbrirSesionUseCase,
  type SesionValida,
} from '../../sesiones/api-sesiones';
import type { AccesoRepository } from '../dominio/acceso.repository';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { CambiarMiContrasenaUseCase } from './cambiar-mi-contrasena.use-case';

const SESION = {
  usuarioId: 7,
  tokenHash: 'token',
  rol: 'JUGADOR',
} as SesionValida;

function preparar() {
  const guardarCambio = jest.fn().mockResolvedValue(true);
  const contarCambios = jest.fn().mockResolvedValue(0);
  const accesos = {
    buscarPorUsuario: jest.fn().mockResolvedValue({
      usuarioId: 7,
      contrasenaHash: 'hash(actual2026)',
      rol: 'JUGADOR',
      estado: 'ACTIVO',
      requiereCambiarContrasena: false,
    }),
    cambiarContrasena: guardarCambio,
    contarCambiosDeContrasena: contarCambios,
  } as unknown as AccesoRepository;
  const reloj = new RelojDePrueba();
  const cambiar = new CambiarMiContrasenaUseCase(
    accesos,
    { hashear: (c: Contrasena) => Promise.resolve(`hash(${c.texto})`) },
    async (texto, hash) => `hash(${texto})` === hash,
    new AbrirSesionUseCase(
      new EnMemoriaSesionRepository(),
      new GeneradorTokenDePrueba(),
      reloj,
    ),
  );
  return { guardarCambio, contarCambios, cambiar };
}

describe('CambiarMiContrasenaUseCase', () => {
  it('guarda la contraseña nueva y abre una sesión renovada', async () => {
    const { guardarCambio, cambiar } = preparar();

    const credencial = await cambiar.ejecutar(
      SESION,
      'actual2026',
      'nueva2026',
    );

    expect(credencial?.token).toBeDefined();
    expect(guardarCambio).toHaveBeenCalledWith(
      expect.objectContaining({
        contrasenaHashNueva: 'hash(nueva2026)',
        tokenHash: 'token',
      }),
    );
  });

  it('no deja cambiarla más de 5 veces en una hora', async () => {
    const { guardarCambio, contarCambios, cambiar } = preparar();
    contarCambios.mockResolvedValue(5);

    await expect(
      cambiar.ejecutar(SESION, 'actual2026', 'nueva2026'),
    ).rejects.toThrow(LimiteExcedidoError);
    expect(guardarCambio).not.toHaveBeenCalled();
  });

  it('exige la contraseña actual correcta', async () => {
    const { guardarCambio, cambiar } = preparar();

    const error = await cambiar
      .ejecutar(SESION, 'otra2026', 'nueva2026')
      .catch((e: unknown) => e);

    expect((error as ReglaInvalidaError).errores).toEqual({
      actual: 'La contraseña actual no es correcta.',
    });
    expect(guardarCambio).not.toHaveBeenCalled();
  });

  it('pide una contraseña distinta a la actual', async () => {
    const { cambiar } = preparar();

    const error = await cambiar
      .ejecutar(SESION, 'actual2026', 'actual2026')
      .catch((e: unknown) => e);

    expect((error as ReglaInvalidaError).errores).toEqual({
      contrasena: 'Elige una contraseña distinta a la actual.',
    });
  });

  it('valida la contraseña nueva con la regla de siempre', async () => {
    const { cambiar } = preparar();

    await expect(
      cambiar.ejecutar(SESION, 'actual2026', 'corta'),
    ).rejects.toBeInstanceOf(ReglaInvalidaError);
  });
});
