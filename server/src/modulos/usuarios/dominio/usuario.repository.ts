import type { LimiteVigente } from './limites-de-cambios';
import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import type { AccionAuditada } from './accion-auditada';
import type { FechaNacimiento } from './fecha-nacimiento.value-object';
import type { NombrePersona } from './nombre-persona.value-object';
import type { SesionNueva } from '../../sesiones/api-sesiones';
import type { Celular } from './celular.value-object';
import type { Correo } from './correo.value-object';
import type { Dorsal } from './dorsal.value-object';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { Usuario } from './usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

/** Datos que cambian en la propia cuenta; los que no vienen quedan igual. `dorsal: null` lo quita. */
export interface DatosPropios {
  nombres?: NombrePersona;
  apellidos?: NombrePersona;
  fechaNacimiento?: FechaNacimiento;
  documento?: DocumentoIdentidad;
  correo?: Correo;
  celular?: Celular;
  dorsal?: Dorsal | null;
}

/** Un cambio de la persona sobre su cuenta, con su acción para la auditoría. */
export interface CambioPropio {
  usuarioId: number;
  datos: DatosPropios;
  accion: AccionAuditada;
  ocurridoEn: Date;
  /** Marca que solo se pone una vez: si ya estaba puesta, no se cambia nada. */
  marca?: 'DATOS_CONFIRMADOS' | 'DOCUMENTO_CAMBIADO';
  /** Cierra las demás sesiones de la cuenta, menos la de este token. */
  conservarSesion?: string;
  /** Se vuelven a contar en la misma escritura: dos pedidos a la vez no los superan. */
  limites?: LimiteVigente[];
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
   * Aplica el cambio y lo deja en la auditoría en una transacción. Devuelve false
   * si su marca ya estaba puesta. Lanza CuentaYaExisteError si el correo o el
   * documento ya pertenecen a otra cuenta.
   */
  aplicarCambioPropio(cambio: CambioPropio): Promise<boolean>;

  /** Cuántas de esas acciones hizo la persona sobre su cuenta desde ese momento. */
  contarAccionesPropias(
    usuarioId: number,
    acciones: AccionAuditada[],
    desde: Date,
  ): Promise<number>;
}
