import type { MinutosParaPagar } from './minutos-para-pagar.value-object';

export const PLAZO_DE_PAGO_REPOSITORY = Symbol('PLAZO_DE_PAGO_REPOSITORY');

/** Mientras administración no guarde un plazo, rige este. */
export const MINUTOS_POR_DEFECTO = 15;

/** Un plazo guardado, con quién lo guardó y cuándo empezó a regir. */
export interface VersionDelPlazo {
  minutos: MinutosParaPagar;
  guardadoEn: Date;
  guardadoPor: string;
}

/** Puerto de las versiones del plazo para pagar. Nunca se editan ni se borran: se agregan. */
export interface PlazoDePagoRepository {
  /** La versión más reciente, o nada si nunca se definió. */
  vigente(): Promise<VersionDelPlazo | undefined>;

  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial(): Promise<VersionDelPlazo[]>;

  /** Agrega una versión solo si cambian los minutos, sin duplicar con guardados simultáneos. */
  guardarSiCambia(
    minutos: MinutosParaPagar,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDelPlazo }>;
}
