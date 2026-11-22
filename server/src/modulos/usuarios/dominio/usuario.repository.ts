import type { Correo } from './correo.value-object';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { Usuario } from './usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

/** Puerto de persistencia de usuarios. */
export interface UsuarioRepository {
  existeConDocumento(documento: DocumentoIdentidad): Promise<boolean>;

  existeConCorreo(correo: Correo): Promise<boolean>;

  /**
   * Guarda un usuario nuevo y devuelve su id. Lanza CuentaYaExisteError si otro
   * registro con el mismo documento o correo se guardó antes.
   */
  crear(usuario: Usuario): Promise<number>;
}
