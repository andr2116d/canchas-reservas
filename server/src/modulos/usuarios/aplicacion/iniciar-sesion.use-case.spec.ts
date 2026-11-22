import { EnMemoriaSesionRepository } from '../../../../test/dobles/en-memoria-sesion.repository';
import { GeneradorTokenDePrueba } from '../../../../test/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { AbrirSesionUseCase } from '../../sesiones/api-sesiones';
import type {
  AccesoRepository,
  CredencialesGuardadas,
} from '../dominio/acceso.repository';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';

const DOMINIO_CORPORATIVO = 'empresa.test';
const CORREO = 'persona@empresa.test';
const CONTRASENA = 'temporal2026';

function preparar(credenciales?: Partial<CredencialesGuardadas>) {
  const reloj = new RelojDePrueba();
  const abrirSesion = new AbrirSesionUseCase(
    new EnMemoriaSesionRepository(),
    new GeneradorTokenDePrueba(),
    reloj,
  );
  const accesos = {
    buscarPorCorreo: jest
      .fn<
        ReturnType<AccesoRepository['buscarPorCorreo']>,
        Parameters<AccesoRepository['buscarPorCorreo']>
      >()
      .mockResolvedValue(
        credenciales && {
          usuarioId: 7,
          rol: 'JUGADOR',
          estado: 'ACTIVO',
          requiereCambiarContrasena: false,
          contrasenaHash: 'hash guardado',
          ...credenciales,
        },
      ),
    registrarInicio: jest
      .fn<
        ReturnType<AccesoRepository['registrarInicio']>,
        Parameters<AccesoRepository['registrarInicio']>
      >()
      .mockResolvedValue(true),
  };
  const verificar = jest.fn(
    async (texto: string, hash?: string) =>
      texto === CONTRASENA && hash === 'hash guardado',
  );
  const iniciar = new IniciarSesionUseCase(
    accesos,
    verificar,
    abrirSesion,
    DOMINIO_CORPORATIVO,
  );
  return { accesos, iniciar, reloj, verificar };
}

describe('IniciarSesionUseCase', () => {
  it.each([
    ['ADMINISTRADOR', CORREO, true],
    ['RECEPCIONISTA', 'turno@correo.test', true],
    ['JUGADOR', 'jugador@correo.test', false],
  ] as const)(
    'abre la sesión de %s y devuelve el estado del cambio de contraseña',
    async (rol, correo, requiereCambiarContrasena) => {
      const { iniciar, accesos, reloj } = preparar({
        rol,
        requiereCambiarContrasena,
      });

      const resultado = await iniciar.ejecutar({
        correo,
        contrasena: CONTRASENA,
      });

      expect(resultado).toMatchObject({
        tipo: 'sesion-abierta',
        rol,
        requiereCambiarContrasena,
      });
      expect(accesos.registrarInicio).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario: expect.objectContaining({ usuarioId: 7 }),
          sesion: expect.objectContaining({ ultimaActividadEn: reloj.ahora() }),
        }),
      );
    },
  );

  it('normaliza el correo antes de buscarlo y verificar el dominio', async () => {
    const { iniciar, accesos } = preparar({ rol: 'ADMINISTRADOR' });

    await expect(
      iniciar.ejecutar({
        correo: ' Persona@EMPRESA.TEST ',
        contrasena: CONTRASENA,
      }),
    ).resolves.toMatchObject({ tipo: 'sesion-abierta' });
    expect(accesos.buscarPorCorreo).toHaveBeenCalledWith(
      expect.objectContaining({ direccion: CORREO }),
    );
  });

  it.each([
    'persona@empresa.test.otro.test',
    'persona@falsaempresa.test',
    'persona@correo.test',
  ])('deniega el acceso de administración con %s', async (correo) => {
    const { iniciar, accesos } = preparar({ rol: 'ADMINISTRADOR' });

    await expect(
      iniciar.ejecutar({ correo, contrasena: CONTRASENA }),
    ).resolves.toEqual({ tipo: 'credenciales-invalidas' });
    expect(accesos.registrarInicio).not.toHaveBeenCalled();
  });

  it('ejecuta la verificación de contraseña aunque el correo no exista', async () => {
    const { iniciar, verificar } = preparar();

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: CONTRASENA }),
    ).resolves.toEqual({ tipo: 'credenciales-invalidas' });
    expect(verificar).toHaveBeenCalledWith(CONTRASENA, undefined);
  });

  it('devuelve el mismo rechazo si falla la contraseña de una cuenta inactiva', async () => {
    const { iniciar, accesos } = preparar({ estado: 'INACTIVO' });

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: 'incorrecta' }),
    ).resolves.toEqual({ tipo: 'credenciales-invalidas' });
    expect(accesos.registrarInicio).not.toHaveBeenCalled();
  });

  it('indica cuenta inactiva únicamente con credenciales correctas', async () => {
    const { iniciar, accesos } = preparar({ estado: 'INACTIVO' });

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: CONTRASENA }),
    ).resolves.toEqual({ tipo: 'cuenta-inactiva' });
    expect(accesos.registrarInicio).not.toHaveBeenCalled();
  });

  it('no emite una sesión si la cuenta cambió antes de persistir el acceso', async () => {
    const { iniciar, accesos } = preparar({});
    accesos.registrarInicio.mockResolvedValue(false);

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: CONTRASENA }),
    ).resolves.toEqual({ tipo: 'credenciales-invalidas' });
  });
});
