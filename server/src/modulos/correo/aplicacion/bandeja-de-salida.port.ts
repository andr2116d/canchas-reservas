import type { Correo, CorreoEnCola } from '../dominio/correo';

export const BANDEJA_DE_SALIDA = Symbol('BANDEJA_DE_SALIDA');

/** Minutos que un correo tomado queda reservado para quien lo envía; si nadie lo cierra, vuelve a la cola. */
export const MINUTOS_DE_RESERVA = 5;

/** Correos del servicio por enviar. Guardarlos antes de enviar permite reintentar y deja constancia. */
export interface BandejaDeSalida {
  encolar(correo: Correo): Promise<void>;

  /** Toma los que ya toca enviar, suma un intento a cada uno y los reserva para que nadie más los tome. */
  tomarPendientes(ahora: Date, cantidad: number): Promise<CorreoEnCola[]>;

  marcarEnviado(id: number, enviadoEn: Date): Promise<void>;

  reprogramar(id: number, proximoIntentoEn: Date, error: string): Promise<void>;

  marcarFallido(id: number, error: string): Promise<void>;
}
