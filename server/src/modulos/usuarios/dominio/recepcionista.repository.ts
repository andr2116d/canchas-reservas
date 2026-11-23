import type {
  EstadoUsuario,
  RolUsuario,
} from '../../../compartido/dominio/rol-usuario';
import type { AccionAuditada } from './accion-auditada';
import type { Correo } from './correo.value-object';
import type { DatoUnico } from './cuenta-ya-existe.error';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { Usuario } from './usuario.entity';

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

  /** Guarda la cuenta y su alta en la auditoría en una sola operación. */
  crear(recepcionista: Usuario, accion: AccionRegistrada): Promise<number>;
}
