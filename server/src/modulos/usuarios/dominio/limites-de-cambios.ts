import type { AccionAuditada } from './accion-auditada';

/** Cuántas veces se puede hacer un cambio propio dentro de una ventana de tiempo. */
export interface LimiteDeCambios {
  acciones: AccionAuditada[];
  maximo: number;
  ventanaEnMinutos: number;
  mensaje: string;
}

const UNA_HORA = 60;
const UN_DIA = 24 * 60;

export const LIMITES_DE_CAMBIOS = {
  contrasena: {
    acciones: ['CAMBIO_DE_CONTRASENA'],
    maximo: 5,
    ventanaEnMinutos: UNA_HORA,
    mensaje:
      'La contraseña ya se cambió 5 veces en la última hora. Espera un momento y vuelve a intentarlo.',
  },
  datos: {
    acciones: ['EDICION_PROPIA', 'CAMBIO_DE_CORREO'],
    maximo: 10,
    ventanaEnMinutos: UNA_HORA,
    mensaje:
      'Los datos ya se cambiaron 10 veces en la última hora. Espera un momento y vuelve a intentarlo.',
  },
  correo: {
    acciones: ['CAMBIO_DE_CORREO'],
    maximo: 3,
    ventanaEnMinutos: UN_DIA,
    mensaje: 'El correo ya se cambió 3 veces hoy. Vuelve a intentarlo mañana.',
  },
} as const satisfies Record<string, LimiteDeCambios>;

/** Desde cuándo cuentan los cambios para un límite. */
export function inicioDeLaVentana(limite: LimiteDeCambios, ahora: Date): Date {
  return new Date(ahora.getTime() - limite.ventanaEnMinutos * 60 * 1000);
}

/** Un límite con su ventana ya ubicada en el tiempo, para contarlo al escribir. */
export interface LimiteVigente {
  acciones: AccionAuditada[];
  maximo: number;
  desde: Date;
  mensaje: string;
}

export function limiteVigente(
  limite: LimiteDeCambios,
  ahora: Date,
): LimiteVigente {
  const { acciones, maximo, mensaje } = limite;
  return { acciones, maximo, mensaje, desde: inicioDeLaVentana(limite, ahora) };
}
