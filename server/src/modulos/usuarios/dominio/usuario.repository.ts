import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import type { SesionNueva } from '../../sesiones/api-sesiones';
import type { Celular } from './celular.value-object';
import type { Correo } from './correo.value-object';
import type { Dorsal } from './dorsal.value-object';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { Usuario } from './usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface ContactoNuevo {
  correo?: Correo;
  celular?: Celular;
  dorsal?: Dorsal | null;
}

export interface DatosDelAlta {
  sesion: SesionNueva;
  aceptacion: { version: string; fecha: Date; canal: 'web' };
}

/** Puerto de persistencia de usuarios. */
export interface UsuarioRepository {
  /** Una persona puede tener una cuenta por rol con el mismo documento. */
  existeConDocumento(
    documento: DocumentoIdentidad,
    rol: RolUsuario,
  ): Promise<boolean>;

  existeConCorreo(correo: Correo): Promise<boolean>;

  buscarPorId(id: number): Promise<Usuario | undefined>;

  /**
   * Guarda cuenta, aceptación y sesión en una operación y devuelve el id.
   * Lanza CuentaYaExisteError si ya existe el documento o el correo.
   */
  crear(usuario: Usuario, alta: DatosDelAlta): Promise<number>;

  crearPersonal(usuario: Usuario): Promise<void>;

  /**
   * Cambia los datos de contacto de una cuenta. `dorsal: null` lo quita.
   * Lanza CuentaYaExisteError si el correo ya pertenece a otra cuenta.
   */
  actualizarContacto(id: number, contacto: ContactoNuevo): Promise<void>;
}
