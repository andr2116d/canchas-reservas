import type {
  EstadoUsuario,
  RolUsuario,
} from '../../../compartido/dominio/rol-usuario';
import type { SesionNueva } from '../../sesiones/api-sesiones';
import type { Correo } from './correo.value-object';

export const ACCESO_REPOSITORY = Symbol('ACCESO_REPOSITORY');

export interface CredencialesGuardadas {
  usuarioId: number;
  contrasenaHash: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  requiereCambiarContrasena: boolean;
  /** Hasta cuándo sirve la contraseña temporal; nada si no es temporal. */
  contrasenaTemporalVenceEn?: Date;
  /** Personal que aún no completó o confirmó sus datos. */
  requiereCompletarDatos: boolean;
}

export interface InicioAutenticado {
  usuario: CredencialesGuardadas;
  sesion: SesionNueva;
}

export interface CambioDeContrasena {
  usuario: CredencialesGuardadas;
  tokenHash: string;
  contrasenaHashNueva: string;
  sesion: SesionNueva;
}

export interface AccesoRepository {
  buscarPorCorreo(correo: Correo): Promise<CredencialesGuardadas | undefined>;
  buscarPorUsuario(
    usuarioId: number,
  ): Promise<CredencialesGuardadas | undefined>;
  registrarInicio(inicio: InicioAutenticado): Promise<boolean>;
  cambiarContrasena(cambio: CambioDeContrasena): Promise<boolean>;
}
