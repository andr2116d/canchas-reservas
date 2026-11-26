import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import { type DatoEditable, DATOS_EDITABLES } from '../dominio/datos-editables';
import type { UsuarioRepository } from '../dominio/usuario.repository';

/** Lo que la persona ve de su propia cuenta y lo que puede cambiar. */
export interface Cuenta {
  /** El id de la propia cuenta, por ejemplo para ver su historial. */
  id: number;
  rol: RolUsuario;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  fechaNacimiento?: string;
  correo: string;
  celular?: string;
  dorsal?: number;
  editables: DatoEditable[];
  /** El personal puede pasar una vez de DNI a carné de extranjería o al revés. */
  puedeCambiarTipoDeDocumento: boolean;
}

/** Datos de la cuenta del usuario con sesión iniciada. */
export class ConsultarCuentaUseCase {
  constructor(
    private readonly usuarios: Pick<UsuarioRepository, 'buscarPorId'>,
  ) {}

  async ejecutar(usuarioId: number): Promise<Cuenta | undefined> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) return undefined;
    return {
      id: usuarioId,
      rol: usuario.rol,
      nombres: usuario.nombres.texto,
      apellidos: usuario.apellidos.texto,
      tipoDocumento: usuario.documento?.tipo,
      numeroDocumento: usuario.documento?.numero,
      fechaNacimiento: usuario.fechaNacimiento?.fecha,
      correo: usuario.correo.direccion,
      celular: usuario.celular?.numero,
      dorsal: usuario.dorsal?.numero,
      editables: DATOS_EDITABLES[usuario.rol],
      puedeCambiarTipoDeDocumento:
        usuario.rol !== 'JUGADOR' &&
        Boolean(usuario.documento) &&
        !usuario.documentoCambiadoEn,
    };
  }
}
