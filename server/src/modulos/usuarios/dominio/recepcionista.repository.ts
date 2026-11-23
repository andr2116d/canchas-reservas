import type {
  EstadoUsuario,
  RolUsuario,
} from '../../../compartido/dominio/rol-usuario';
import type { AccionAuditada } from './accion-auditada';
import type { Correo } from './correo.value-object';
import type { DatoUnico } from './cuenta-ya-existe.error';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { DatosDeCuenta, Usuario } from './usuario.entity';

export const RECEPCIONISTA_REPOSITORY = Symbol('RECEPCIONISTA_REPOSITORY');

/** Quién hizo una acción sobre una cuenta y cuándo. */
export interface AccionRegistrada {
  accion: AccionAuditada;
  ejecutadoPorId: number;
  ocurridoEn: Date;
}

/** Cuenta que ya usa el documento o el correo de un alta nueva. */
export interface CuentaCoincidente {
  id: number;
  nombres: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  coincideEn: DatoUnico[];
}

/** Datos de una recepcionista para mostrarlos al administrador. */
export interface FichaDeRecepcionista {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  celular: string;
  estado: EstadoUsuario;
  requiereCambiarContrasena: boolean;
  creadaEn: Date;
}

/** Una acción de la auditoría con el nombre de quien la hizo. */
export interface AccionDelHistorial {
  accion: AccionAuditada;
  ocurridoEn: Date;
  ejecutadoPor: string;
}

export interface FichaConHistorial {
  ficha: FichaDeRecepcionista;
  historial: AccionDelHistorial[];
}

/** Datos personales y de acceso de una recepcionista, sin contraseña ni dorsal. */
export type DatosDeRecepcionistaValidados = Omit<
  DatosDeCuenta,
  'contrasenaHash' | 'dorsal'
>;

/** Lo que cambia en una cuenta de recepción. */
export interface CambiosDeRecepcionista {
  datos?: DatosDeRecepcionistaValidados;
  estado?: EstadoUsuario;
  /** Contraseña temporal nueva: la recepcionista deberá cambiarla al entrar. */
  contrasenaHashTemporal?: string;
  /** Cierra sus sesiones abiertas para que el cambio rija de inmediato. */
  cerrarSesiones?: boolean;
  /** Solo se aplica si la cuenta sigue en este estado. */
  estadoEsperado?: EstadoUsuario;
}

/** Puerto de persistencia de las cuentas de recepción y su auditoría. */
export interface RecepcionistaRepository {
  /**
   * Cuentas con el mismo documento entre las recepcionistas, o con el mismo
   * correo en cualquier cuenta.
   */
  buscarCoincidencias(
    documento: DocumentoIdentidad,
    correo: Correo,
  ): Promise<CuentaCoincidente[]>;

  listar(estado: EstadoUsuario): Promise<FichaDeRecepcionista[]>;

  /** Ficha y acciones de la auditoría, de la más reciente a la más antigua. */
  buscar(id: number): Promise<FichaConHistorial | undefined>;

  /**
   * Aplica los cambios y registra la acción en una sola operación. Devuelve
   * `false` si no hay una recepcionista con ese id (en el estado esperado).
   */
  actualizar(
    id: number,
    cambios: CambiosDeRecepcionista,
    accion: AccionRegistrada,
  ): Promise<boolean>;

  /** Guarda la cuenta y su alta en la auditoría en una sola operación. */
  crear(recepcionista: Usuario, accion: AccionRegistrada): Promise<number>;
}
