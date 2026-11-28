export const USOS_DE_ADICIONAL = Symbol('USOS_DE_ADICIONAL');

/** Si un adicional ya quedó registrado en una reserva: pedido y, más adelante, entregado o cobrado. */
export interface UsosDeAdicional {
  /** De los ids dados, los que ya se usaron. */
  conUsos(adicionalIds: number[]): Promise<Set<number>>;
}
