import { EnMemoriaSesionRepository } from '../../../../test/sesiones/dobles/en-memoria-sesion.repository';
import { GeneradorTokenDePrueba } from '../../../../test/compartido/dobles/generador-token-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { AbrirSesionUseCase } from '../../sesiones/api-sesiones';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
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
          rol: 'RECEPCIONISTA',
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
  const iniciar = new IniciarSesionUseCase(accesos, verificar, abrirSesion, {
    correos: new ReglasDeCorreo(DOMINIO_CORPORATIVO),
    reloj,
  });
  return { accesos, iniciar, reloj, verificar };
}

describe('IniciarSesionUseCase', () => {
  it.each([
    ['ADMINISTRADOR', CORREO, true],
    ['RECEPCIONISTA', 'turno@empresa.test', true],
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
  ])('deniega el acceso del personal con %s', async (correo) => {
    const { iniciar, accesos } = preparar({ rol: 'RECEPCIONISTA' });

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

  it('rechaza una contraseña temporal vencida sin abrir sesión', async () => {
    const { iniciar, accesos, reloj } = preparar({
      requiereCambiarContrasena: true,
    });
    accesos.buscarPorCorreo.mockResolvedValue({
      usuarioId: 7,
      rol: 'RECEPCIONISTA',
      estado: 'ACTIVO',
      requiereCambiarContrasena: true,
      contrasenaHash: 'hash guardado',
      contrasenaTemporalVenceEn: reloj.ahora(),
    });

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: CONTRASENA }),
    ).resolves.toEqual({ tipo: 'contrasena-temporal-vencida' });
    expect(accesos.registrarInicio).not.toHaveBeenCalled();
  });

  it('informa hasta cuándo sirve una contraseña temporal vigente', async () => {
    const { iniciar, accesos, reloj } = preparar();
    const vence = new Date(reloj.ahora().getTime() + 60 * 60 * 1000);
    accesos.buscarPorCorreo.mockResolvedValue({
      usuarioId: 7,
      rol: 'RECEPCIONISTA',
      estado: 'ACTIVO',
      requiereCambiarContrasena: true,
      contrasenaHash: 'hash guardado',
      contrasenaTemporalVenceEn: vence,
    });

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: CONTRASENA }),
    ).resolves.toMatchObject({
      tipo: 'sesion-abierta',
      contrasenaTemporalVenceEn: vence,
    });
  });

  it('no emite una sesión si la cuenta cambió antes de persistir el acceso', async () => {
    const { iniciar, accesos } = preparar({});
    accesos.registrarInicio.mockResolvedValue(false);

    await expect(
      iniciar.ejecutar({ correo: CORREO, contrasena: CONTRASENA }),
    ).resolves.toEqual({ tipo: 'credenciales-invalidas' });
  });
});
