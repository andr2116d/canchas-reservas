import type { SesionNueva } from '../../sesiones/api-sesiones';
import type { Correo } from './correo.value-object';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { Usuario } from './usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface DatosDelAlta {
  sesion: SesionNueva;
  aceptacion: { version: string; fecha: Date; canal: 'web' };
}

/** Puerto de persistencia de usuarios. */
export interface UsuarioRepository {
  existeConDocumento(documento: DocumentoIdentidad): Promise<boolean>;

  existeConCorreo(correo: Correo): Promise<boolean>;

  buscarPorId(id: number): Promise<Usuario | undefined>;

  /**
   * Guarda cuenta, aceptación y sesión en una operación y devuelve el id.
   * Lanza CuentaYaExisteError si ya existe el documento o el correo.
   */
  crear(usuario: Usuario, alta: DatosDelAlta): Promise<number>;

  crearPersonal(usuario: Usuario): Promise<void>;
}
