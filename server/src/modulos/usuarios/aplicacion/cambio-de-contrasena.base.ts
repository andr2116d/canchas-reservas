import type {
  AbrirSesionUseCase,
  SesionAbierta,
  SesionValida,
} from '../../sesiones/api-sesiones';
import type {
  AccesoRepository,
  CredencialesGuardadas,
} from '../dominio/acceso.repository';
import type { Contrasena } from '../dominio/contrasena.value-object';
import type { HasheadorContrasena } from './hasheador-contrasena.port';
import type { VerificarContrasena } from './iniciar-sesion.use-case';

/**
 * Base de los cambios de contraseña: guarda la nueva, deja de ser temporal,
 * cierra las demás sesiones y devuelve una sesión renovada.
 */
export abstract class CambioDeContrasenaBase {
  constructor(
    protected readonly accesos: AccesoRepository,
    private readonly hasheador: HasheadorContrasena,
    protected readonly verificarContrasena: VerificarContrasena,
    private readonly abrirSesion: AbrirSesionUseCase,
  ) {}

  protected async guardar(
    sesion: SesionValida,
    usuario: CredencialesGuardadas,
    contrasena: Contrasena,
  ): Promise<SesionAbierta | undefined> {
    const contrasenaHashNueva = await this.hasheador.hashear(contrasena);
    const { datosDeSesion, credencial } = this.abrirSesion.preparar();
    const cambiada = await this.accesos.cambiarContrasena({
      usuario,
      tokenHash: sesion.tokenHash,
      contrasenaHashNueva,
      sesion: datosDeSesion,
    });
    return cambiada ? credencial : undefined;
  }
}
