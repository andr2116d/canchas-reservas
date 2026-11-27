import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';

/** Qué pasó. El texto lo arma la pantalla; la base no guarda datos personales en el aviso. */
export const TIPOS_DE_AVISO = [
  'NUEVO_RECLAMO',
  'RECLAMO_RESPONDIDO',
  'NUEVA_RESERVA',
] as const;
export type TipoDeAviso = (typeof TIPOS_DE_AVISO)[number];

/** Un aviso para una persona: el tipo y a qué se refiere (por ejemplo, el número de una hoja). */
export interface Aviso {
  id: number;
  tipo: TipoDeAviso;
  referencia: string;
  creadoEn: Date;
  leidoEn: Date | null;
}

export interface AvisoNuevo {
  tipo: TipoDeAviso;
  referencia: string;
  creadoEn: Date;
}

export const AVISO_REPOSITORY = Symbol('AVISO_REPOSITORY');

/** Puerto de los avisos. Cada aviso nuevo se anuncia en tiempo real a su destinatario. */
export interface AvisoRepository {
  /** Un aviso para cada cuenta activa del rol. */
  crearParaRol(rol: RolUsuario, aviso: AvisoNuevo): Promise<void>;

  crearPara(usuarioId: number, aviso: AvisoNuevo): Promise<void>;

  /** Los más recientes primero. */
  recientes(usuarioId: number, limite: number): Promise<Aviso[]>;

  sinLeer(usuarioId: number): Promise<number>;

  /** Solo si el aviso es de esa persona; devuelve si lo encontró. */
  marcarLeido(
    usuarioId: number,
    avisoId: number,
    momento: Date,
  ): Promise<boolean>;

  marcarTodosLeidos(usuarioId: number, momento: Date): Promise<void>;
}
