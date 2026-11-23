import type { HoraDelDia } from '../dominio/hora-del-dia.value-object';

export const HORARIO_DE_FRANJAS = Symbol('HORARIO_DE_FRANJAS');

/** Desde qué hora rige la tarifa de noche. Será configurable con el horario del local. */
export interface HorarioDeFranjas {
  inicioDeLaNoche(): Promise<HoraDelDia>;
}
